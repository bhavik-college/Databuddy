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


.PHONY: setup-nodes init-swarm update-swarm install-dependencies deploy-ingress deploy-ssl-cert deploy-monitoring deploy-aqua deploy-registry
