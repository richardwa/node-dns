
if (-not (Test-Path -Path Dockerfile)) {
    Write-Host "Dockerfile required at current directory"
    Exit
}

$targetHost = 'rich@omv'

# Get the current working directory path
$currentDirectoryPath = Get-Location

# Extract the directory name from the path
$projectName = Split-Path -Leaf $currentDirectoryPath


ssh $targetHost "rm -rf $projectName && mkdir $projectName"

# Read the Dockerfile content
$dockerfileContent = Get-Content -Path Dockerfile

# Regular expression pattern to match COPY lines
$copyPattern = '^\s*COPY\s+(?<source>.*?)\s+(?<destination>.*?)\s*$'

# Iterate through the Dockerfile content and extract COPY lines
$dockerfileContent | Where-Object { $_ -match $copyPattern } | ForEach-Object {
    $source = $Matches['source']
    $destination = $Matches['destination']

    $target = Join-Path -Path $projectName -ChildPath $destination
    $target = $target -replace '\\', '/'
    scp -r $source "${targetHost}:~/$target" 
}
scp Dockerfile "${targetHost}:~/$projectName"

$gitHash = & git rev-parse HEAD
$shortGitHash = $gitHash.Substring(0, 6)
$tag = "${projectName}:$shortGitHash"

$script = @"
echo "first line not executed - not sure why"
#!/bin/bash
cd $projectName
docker build -t $tag .

# Check if the container is running
if docker container inspect -f '{{.State.Running}}' "$projectName" >/dev/null 2>&1; then
  # Stop the container
  docker container stop "$projectName"
  echo "Container $projectName stopped."
fi

# Check if the container exists
if docker container inspect "$projectName" >/dev/null 2>&1; then
  # Remove the container
  docker container rm "$projectName"
  echo "Container $projectName removed."
else
  echo "Container $projectName does not exist."
fi

nohup docker run -d \
    -p 8081:8080 \
    -p 8053:8053 \
    --name $projectName \
    $tag `&
"@

$script = $script -replace "`r", ""
ssh rich@omv bash -c $script