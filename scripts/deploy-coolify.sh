#!/usr/bin/env bash
set -euo pipefail

: "${COOLIFY_BASE_URL:?Set COOLIFY_BASE_URL, e.g. http://2.25.161.32:8000}"
: "${COOLIFY_TOKEN:?Set COOLIFY_TOKEN from Coolify Keys & Tokens}"
: "${COOLIFY_PROJECT_UUID:?Set COOLIFY_PROJECT_UUID}"
: "${COOLIFY_SERVER_UUID:?Set COOLIFY_SERVER_UUID}"
: "${COOLIFY_ENVIRONMENT_UUID:?Set COOLIFY_ENVIRONMENT_UUID}"
: "${COOLIFY_PRIVATE_KEY_UUID:?Set COOLIFY_PRIVATE_KEY_UUID for the Git deploy key}"

APP_NAME="${APP_NAME:-nickhub}"
APP_DOMAIN="${APP_DOMAIN:-https://thirty4x.com}"
GIT_REPOSITORY="${GIT_REPOSITORY:-git@github.com:BoabNick/nickhub.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"

api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -fsS -X "$method" \
    "${COOLIFY_BASE_URL%/}/api/v1${path}" \
    -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

payload="$(jq -n \
  --arg project_uuid "$COOLIFY_PROJECT_UUID" \
  --arg server_uuid "$COOLIFY_SERVER_UUID" \
  --arg environment_uuid "$COOLIFY_ENVIRONMENT_UUID" \
  --arg environment_name "production" \
  --arg private_key_uuid "$COOLIFY_PRIVATE_KEY_UUID" \
  --arg git_repository "$GIT_REPOSITORY" \
  --arg git_branch "$GIT_BRANCH" \
  --arg name "$APP_NAME" \
  --arg domain "$APP_DOMAIN" \
  '{
    project_uuid: $project_uuid,
    server_uuid: $server_uuid,
    environment_uuid: $environment_uuid,
    environment_name: $environment_name,
    private_key_uuid: $private_key_uuid,
    git_repository: $git_repository,
    git_branch: $git_branch,
    build_pack: "dockercompose",
    docker_compose_location: "/docker-compose.yml",
    name: $name,
    ports_exposes: "3000",
    health_check_enabled: true,
    health_check_path: "/api/health",
    health_check_port: "3000",
    is_force_https_enabled: true,
    instant_deploy: true,
    docker_compose_domains: [
      {
        name: "nickhub",
        domain: $domain
      }
    ]
  }')"

echo "Creating Coolify application '${APP_NAME}' for ${APP_DOMAIN}..."
response="$(api POST /applications/private-deploy-key --data "$payload")"
app_uuid="$(echo "$response" | jq -r '.uuid // empty')"

if [[ -z "$app_uuid" ]]; then
  echo "$response"
  exit 1
fi

echo "Application UUID: ${app_uuid}"
echo "Deploy triggered. Check Coolify for build logs."
