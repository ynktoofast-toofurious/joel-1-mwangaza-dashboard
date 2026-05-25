$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Region = 'us-east-1'
$App = 'mwangaza-api'
$RepoName = 'mwangaza-api'
$ClusterName = 'mwangaza-api-cluster'
$ServiceName = 'mwangaza-api-service'
$TaskFamily = 'mwangaza-api-task'
$AlbName = 'mwangaza-api-alb'
$TgName = 'mwangaza-api-tg'
$LogGroup = '/ecs/mwangaza-api'
$VpcId = 'vpc-0d1ad675e75837762'
$Subnets = @('subnet-0aa41dbfb88b88066', 'subnet-0cbe5b0838f7fcebb')
$DefaultSg = 'sg-0799c4d7c83fc9121'

Set-Location (Join-Path $PSScriptRoot '..')
$AccountId = aws sts get-caller-identity --query Account --output text

# ECR repository
$repoExists = $false
try {
  aws ecr describe-repositories --repository-names $RepoName --region $Region | Out-Null
  $repoExists = $true
} catch {
  $repoExists = $false
}
if (-not $repoExists) {
  aws ecr create-repository --repository-name $RepoName --image-scanning-configuration scanOnPush=true --region $Region | Out-Null
}
$ImageUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$RepoName:$((Get-Date).ToString('yyyyMMddHHmmss'))"

# Build and push API image
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AccountId.dkr.ecr.$Region.amazonaws.com"
docker build -t $ImageUri .\api
docker push $ImageUri

# Secret payload from api/.env + placeholders
$envMap = @{}
Get-Content .\api\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_.Split('=', 2)
  if ($parts.Count -eq 2) { $envMap[$parts[0].Trim()] = $parts[1].Trim() }
}
if (-not $envMap.ContainsKey('PUBLIC_BASE_URL')) { $envMap['PUBLIC_BASE_URL'] = 'https://api.mysmartwork.tech' }
if (-not $envMap.ContainsKey('WHATSAPP_VERIFY_TOKEN')) { $envMap['WHATSAPP_VERIFY_TOKEN'] = '' }
if (-not $envMap.ContainsKey('WHATSAPP_ACCESS_TOKEN')) { $envMap['WHATSAPP_ACCESS_TOKEN'] = '' }
if (-not $envMap.ContainsKey('WHATSAPP_PHONE_NUMBER_ID')) { $envMap['WHATSAPP_PHONE_NUMBER_ID'] = '' }
if (-not $envMap.ContainsKey('WHATSAPP_GRAPH_VERSION')) { $envMap['WHATSAPP_GRAPH_VERSION'] = 'v20.0' }
if (-not $envMap.ContainsKey('OPENAI_API_KEY')) { $envMap['OPENAI_API_KEY'] = '' }
if (-not $envMap.ContainsKey('OPENAI_MODEL')) { $envMap['OPENAI_MODEL'] = 'gpt-4o-mini' }

$SecretName = 'mwangaza/api/prod'
$SecretJson = ($envMap | ConvertTo-Json -Compress)
$SecretArn = ''
try {
  $SecretArn = aws secretsmanager describe-secret --secret-id $SecretName --region $Region --query ARN --output text
  aws secretsmanager put-secret-value --secret-id $SecretName --secret-string $SecretJson --region $Region | Out-Null
} catch {
  $SecretArn = aws secretsmanager create-secret --name $SecretName --secret-string $SecretJson --region $Region --query ARN --output text
}

# IAM roles
$ExecRoleArn = ''
try {
  $ExecRoleArn = aws iam get-role --role-name ecsTaskExecutionRole --query Role.Arn --output text
} catch {
  $trust = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document $trust | Out-Null
  aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy | Out-Null
  aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite | Out-Null
  Start-Sleep -Seconds 10
  $ExecRoleArn = aws iam get-role --role-name ecsTaskExecutionRole --query Role.Arn --output text
}

$TaskRoleName = 'mwangazaApiTaskRole'
$TaskRoleArn = ''
try {
  $TaskRoleArn = aws iam get-role --role-name $TaskRoleName --query Role.Arn --output text
} catch {
  $trust = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  aws iam create-role --role-name $TaskRoleName --assume-role-policy-document $trust | Out-Null
  aws iam attach-role-policy --role-name $TaskRoleName --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite | Out-Null
  Start-Sleep -Seconds 10
  $TaskRoleArn = aws iam get-role --role-name $TaskRoleName --query Role.Arn --output text
}

try { aws logs create-log-group --log-group-name $LogGroup --region $Region | Out-Null } catch {}

# Security groups
$AlbSgId = ''
$EcsSgId = ''
$albExisting = aws ec2 describe-security-groups --filters Name=group-name,Values=mwangaza-api-alb-sg Name=vpc-id,Values=$VpcId --region $Region --query "SecurityGroups[0].GroupId" --output text
if ($albExisting -and $albExisting -ne 'None') {
  $AlbSgId = $albExisting
} else {
  $AlbSgId = aws ec2 create-security-group --group-name mwangaza-api-alb-sg --description "ALB SG for mwangaza api" --vpc-id $VpcId --region $Region --query GroupId --output text
}

$ecsExisting = aws ec2 describe-security-groups --filters Name=group-name,Values=mwangaza-api-ecs-sg Name=vpc-id,Values=$VpcId --region $Region --query "SecurityGroups[0].GroupId" --output text
if ($ecsExisting -and $ecsExisting -ne 'None') {
  $EcsSgId = $ecsExisting
} else {
  $EcsSgId = aws ec2 create-security-group --group-name mwangaza-api-ecs-sg --description "ECS SG for mwangaza api" --vpc-id $VpcId --region $Region --query GroupId --output text
}

try { aws ec2 authorize-security-group-ingress --group-id $AlbSgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region | Out-Null } catch {}
try { aws ec2 authorize-security-group-ingress --group-id $AlbSgId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region | Out-Null } catch {}
try { aws ec2 authorize-security-group-ingress --group-id $EcsSgId --protocol tcp --port 4000 --source-group $AlbSgId --region $Region | Out-Null } catch {}
try { aws ec2 authorize-security-group-ingress --group-id $DefaultSg --protocol tcp --port 5439 --source-group $EcsSgId --region $Region | Out-Null } catch {}

# ECS cluster
try { aws ecs create-cluster --cluster-name $ClusterName --region $Region | Out-Null } catch {}

# ALB and target group
$AlbArn = aws elbv2 describe-load-balancers --names $AlbName --region $Region --query "LoadBalancers[0].LoadBalancerArn" --output text 2>$null
if (-not $AlbArn -or $AlbArn -eq 'None') {
  $AlbArn = aws elbv2 create-load-balancer --name $AlbName --subnets $Subnets --security-groups $AlbSgId --scheme internet-facing --type application --ip-address-type ipv4 --region $Region --query "LoadBalancers[0].LoadBalancerArn" --output text
}
$AlbDns = aws elbv2 describe-load-balancers --load-balancer-arns $AlbArn --region $Region --query "LoadBalancers[0].DNSName" --output text

$TgArn = aws elbv2 describe-target-groups --names $TgName --region $Region --query "TargetGroups[0].TargetGroupArn" --output text 2>$null
if (-not $TgArn -or $TgArn -eq 'None') {
  $TgArn = aws elbv2 create-target-group --name $TgName --protocol HTTP --port 4000 --vpc-id $VpcId --target-type ip --health-check-path /health --health-check-protocol HTTP --health-check-interval-seconds 30 --health-check-timeout-seconds 5 --healthy-threshold-count 2 --unhealthy-threshold-count 3 --matcher HttpCode=200 --region $Region --query "TargetGroups[0].TargetGroupArn" --output text
}

$ListenerArn = aws elbv2 describe-listeners --load-balancer-arn $AlbArn --region $Region --query "Listeners[?Port==`80`].ListenerArn | [0]" --output text 2>$null
if (-not $ListenerArn -or $ListenerArn -eq 'None') {
  aws elbv2 create-listener --load-balancer-arn $AlbArn --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TgArn --region $Region | Out-Null
}

# ACM certificate for API domain
$CertArn = aws acm list-certificates --region $Region --query "CertificateSummaryList[?DomainName=='api.mysmartwork.tech'].CertificateArn | [0]" --output text
if (-not $CertArn -or $CertArn -eq 'None') {
  $CertArn = aws acm request-certificate --domain-name api.mysmartwork.tech --validation-method DNS --region $Region --query CertificateArn --output text
}
$CertValidation = aws acm describe-certificate --certificate-arn $CertArn --region $Region --query "Certificate.DomainValidationOptions[0].ResourceRecord" --output json

# Task definition
$TaskDefPath = Join-Path $env:TEMP 'mwangaza-taskdef.json'
$taskDef = @"
{
  "family": "$TaskFamily",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$ExecRoleArn",
  "taskRoleArn": "$TaskRoleArn",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "$ImageUri",
      "essential": true,
      "portMappings": [
        { "containerPort": 4000, "hostPort": 4000, "protocol": "tcp" }
      ],
      "secrets": [
        {"name":"REDSHIFT_HOST","valueFrom":"$SecretArn:REDSHIFT_HOST::"},
        {"name":"REDSHIFT_PORT","valueFrom":"$SecretArn:REDSHIFT_PORT::"},
        {"name":"REDSHIFT_DB","valueFrom":"$SecretArn:REDSHIFT_DB::"},
        {"name":"REDSHIFT_USER","valueFrom":"$SecretArn:REDSHIFT_USER::"},
        {"name":"REDSHIFT_PASSWORD","valueFrom":"$SecretArn:REDSHIFT_PASSWORD::"},
        {"name":"REDSHIFT_SCHEMA","valueFrom":"$SecretArn:REDSHIFT_SCHEMA::"},
        {"name":"REDSHIFT_SSL","valueFrom":"$SecretArn:REDSHIFT_SSL::"},
        {"name":"PUBLIC_BASE_URL","valueFrom":"$SecretArn:PUBLIC_BASE_URL::"},
        {"name":"WHATSAPP_VERIFY_TOKEN","valueFrom":"$SecretArn:WHATSAPP_VERIFY_TOKEN::"},
        {"name":"WHATSAPP_ACCESS_TOKEN","valueFrom":"$SecretArn:WHATSAPP_ACCESS_TOKEN::"},
        {"name":"WHATSAPP_PHONE_NUMBER_ID","valueFrom":"$SecretArn:WHATSAPP_PHONE_NUMBER_ID::"},
        {"name":"WHATSAPP_GRAPH_VERSION","valueFrom":"$SecretArn:WHATSAPP_GRAPH_VERSION::"},
        {"name":"OPENAI_API_KEY","valueFrom":"$SecretArn:OPENAI_API_KEY::"},
        {"name":"OPENAI_MODEL","valueFrom":"$SecretArn:OPENAI_MODEL::"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LogGroup",
          "awslogs-region": "$Region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
"@
Set-Content -Path $TaskDefPath -Value $taskDef -Encoding UTF8
$TaskDefArn = aws ecs register-task-definition --cli-input-json file://$TaskDefPath --region $Region --query "taskDefinition.taskDefinitionArn" --output text

# Service create/update
$SvcArn = aws ecs describe-services --cluster $ClusterName --services $ServiceName --region $Region --query "services[0].serviceArn" --output text 2>$null
$SubnetsList = ($Subnets -join ',')
if (-not $SvcArn -or $SvcArn -eq 'None') {
  aws ecs create-service --cluster $ClusterName --service-name $ServiceName --task-definition $TaskDefArn --desired-count 2 --launch-type FARGATE --platform-version LATEST --network-configuration "awsvpcConfiguration={subnets=[$SubnetsList],securityGroups=[$EcsSgId],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=$TgArn,containerName=api,containerPort=4000" --health-check-grace-period-seconds 60 --region $Region | Out-Null
} else {
  aws ecs update-service --cluster $ClusterName --service $ServiceName --task-definition $TaskDefArn --desired-count 2 --region $Region | Out-Null
}

# Auto scaling
$ResourceId = "service/$ClusterName/$ServiceName"
aws application-autoscaling register-scalable-target --service-namespace ecs --resource-id $ResourceId --scalable-dimension ecs:service:DesiredCount --min-capacity 2 --max-capacity 6 --region $Region | Out-Null
aws application-autoscaling put-scaling-policy --service-namespace ecs --resource-id $ResourceId --scalable-dimension ecs:service:DesiredCount --policy-name mwangaza-cpu-target --policy-type TargetTrackingScaling --target-tracking-scaling-policy-configuration '{"TargetValue":55.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"ECSServiceAverageCPUUtilization"},"ScaleInCooldown":120,"ScaleOutCooldown":60}' --region $Region | Out-Null

# CloudWatch alarms
aws cloudwatch put-metric-alarm --alarm-name mwangaza-api-ecs-cpu-high --metric-name CPUUtilization --namespace AWS/ECS --statistic Average --period 60 --threshold 80 --comparison-operator GreaterThanThreshold --evaluation-periods 5 --alarm-description "High CPU on ECS service" --dimensions Name=ClusterName,Value=$ClusterName Name=ServiceName,Value=$ServiceName --region $Region | Out-Null
$TgFullArn = aws elbv2 describe-target-groups --target-group-arns $TgArn --region $Region --query "TargetGroups[0].TargetGroupArn" --output text
$LbFullArn = aws elbv2 describe-load-balancers --load-balancer-arns $AlbArn --region $Region --query "LoadBalancers[0].LoadBalancerArn" --output text
$TgSuffix = $TgFullArn.Split('targetgroup/')[1]
$LbSuffix = $LbFullArn.Split('loadbalancer/')[1]
aws cloudwatch put-metric-alarm --alarm-name mwangaza-api-unhealthy-hosts --metric-name UnHealthyHostCount --namespace AWS/ApplicationELB --statistic Average --period 60 --threshold 0 --comparison-operator GreaterThanThreshold --evaluation-periods 2 --alarm-description "Unhealthy targets in API target group" --dimensions Name=TargetGroup,Value=targetgroup/$TgSuffix Name=LoadBalancer,Value=app/$LbSuffix --region $Region | Out-Null

# Wait stable
aws ecs wait services-stable --cluster $ClusterName --services $ServiceName --region $Region

Write-Output "ALB_DNS=$AlbDns"
Write-Output "CERT_ARN=$CertArn"
Write-Output "CERT_DNS_VALIDATION=$CertValidation"
Write-Output "SECRET_ARN=$SecretArn"
Write-Output "ECS_SERVICE=$ServiceName"
