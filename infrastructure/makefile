SSH_PRIVATE_KEY=$$HOME/.ssh/id_rsa

install-dependencies:
	ansible-galaxy collection install ansible.posix
	ansible-galaxy collection install community.docker
	ansible-galaxy collection install community.general

setup-nodes: install-dependencies
	ansible-galaxy collection install community.general
	ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i inventory.ini setup-nodes.yaml \
			-e "hosts_group=infra-nodes" 

init-swarm: install-dependencies
	ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i inventory.ini setup-swarm.yaml -e hosts_group=infra-nodes 

update-swarm: install-dependencies
	ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i inventory.ini add-swarm-nodes.yaml -e hosts_group=infra-nodes

deploy-ingress: install-dependencies
	cd ingress && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-ingress.yaml


deploy-ci: install-dependencies
	cd ci && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-ci.yaml

deploy-ssl-cert: install-dependencies
	cd ingress && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini  --vault-id "databuddy_cc_star_key@prompt" deploy-certificate.yaml 

deploy-monitoring: install-dependencies
	cd monitoring && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-monitoring.yaml

deploy-aqua: install-dependencies
	cd aqua && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-aqua.yaml

deploy-registry: install-dependencies
	cd registry && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-registry.yaml

deploy-app: install-dependencies
	cd deploy && ansible-playbook --timeout 60 --ssh-common-args="-i $(SSH_PRIVATE_KEY) -o ServerAliveInterval=15" -i ../inventory.ini deploy-databuddy.yaml \
		--extra-vars "ipinfo_token=$$IPINFO_TOKEN" \
		--extra-vars "ai_api_key=$$AI_API_KEY" \
		--extra-vars "better_auth_url=$$BETTER_AUTH_URL" \
		--extra-vars "better_auth_secret=$$BETTER_AUTH_SECRET" \
		--extra-vars "github_client_id=$$GITHUB_CLIENT_ID" \
		--extra-vars "github_client_secret=$$GITHUB_CLIENT_SECRET" \
		--extra-vars "google_client_id=$$GOOGLE_CLIENT_ID" \
		--extra-vars "google_client_secret=$$GOOGLE_CLIENT_SECRET" \
		--extra-vars "opr_api_key=$$OPR_API_KEY" \
		--extra-vars "version=$$DATABUDDY_VERSION" \
		--extra-vars "docker_username=$$DOCKER_USERNAME" \
		--extra-vars "docker_password=$$DOCKER_PASSWORD" \
		--extra-vars "deployment_target=infra-nodes" 



.PHONY: setup-nodes init-swarm update-swarm install-dependencies deploy-ingress deploy-ssl-cert deploy-monitoring deploy-aqua deploy-registry deploy-app
