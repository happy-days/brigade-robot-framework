# brigade-robot-framework

This repository uses [Azure/Brigade](https://github.com/Azure/brigade) for running in cluster ([Kubernetes](https://kubernetes.io/)) Robot Framework tests.

## Prerequisites

1. Have a running [Kubernetes](https://kubernetes.io/docs/setup/) environment
2. Setup [Helm](https://github.com/kubernetes/helm) - this assumes Helm on your Host regardless of the Helm container used later on.
3. (optional) an NFS Provisioner - my environment uses Kubernetes clusters running on standalone bare metal machines. 
    Recommended simple NFS Provisioner is [IlyaSemenov/nfs-provisioner-chart](https://github.com/IlyaSemenov/nfs-provisioner-chart).
    Follow the instructions for adding the helm repo. At install set this as the default Provisioner:
```bash
$ helm install --name nfs-provisioner --namespace nfs-provisioner nfs-provisioner/nfs-provisioner --set defaultClass=true
```
If  not already set up on your host, add nfs-common
```bash
$ apt-get install nfs-commons
```

## Install

### Set up Brigade

Follow the [quick-start guide](https://github.com/Azure/brigade#quickstart):

Install Brigade into your Kubernetes cluster is to install it using Helm.

```bash
$ helm repo add brigade https://azure.github.io/brigade
$ helm install -n brigade brigade/brigade
```

To manually run Brigade Projects the **brig** binary is required. Follow the
[Developers Guide](https://github.com/Azure/brigade/blob/master/docs/topics/developers.md)
to build the binary. Assuming Brigade is cloned and prerequisites met, simply run:
```bash
$ make brig
```
Test **brig** with `brig version`

### Install brigade-robot-framework 

Clone brigade-robot-framework  and change directory
```bash
$ git clone https://github.com/charter-ctec/brigade-robot-framework
$ cd brigade-robot-framework
```
Helm install brigade-robot-framework
> note the name and namespace can be customized
```bash
$ helm install --name robot-brigade brigade/brigade-project -f robot-values.yaml \
    --set secrets.dvc_user=<device_user> \
    --set secrets.dvc_pass=<device_password> \
    --set secrets.dvc_ipaddr=<device_ip_address> \
    --set secrets.dvc_name=<device_name> \
    --set secrets.minio_user=<minio_key> \
    --set secrets.minio_pass=<minio_secret> \
    --set secrests.slack_webhook=<webhook_url>
```

### Set up Minio

```bash
$ kubectl apply -f minio-deployment/minio-deployment.yaml
```

## Usage

Manually run the project. The project name is the same as the project value in
the *robot-values.yaml*
```bash
$ brig run charter-ctec/brigade-robot-framework
```
The project will automatically run all the tests in the test/ directory.

## Notes

Details on the Docker image used can be found [here](https://github.com/charter-ctec/dockerfiles)

If you make changes to *robot-values.yaml* you'll need to redeploy the project.
```bash
$ helm delete robot-brigade --purge
```

In 0.8.0 the vacuum pod fails trying to find the kubeconfig, they are working on the fix but the temporary workaround is to run this command

```bash
helm upgrade brigade brigade/brigade --set vacuum.enabled=false
```

If rbac is enabled in the cluster you may get an javascript Object error even if the logs of the worker pod are okay. To temporarilyy work around this add a role for the brigade work

```bash
kubectl create clusterrolebinding brigade --clusterrole cluster-admin --serviceaccount="default:brigade-worker"
```

## Contribute

PRs accepted.

## License

Apache
