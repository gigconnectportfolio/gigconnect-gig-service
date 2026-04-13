def namespace = "production"
def serviceName = "gigconnect-chat"
def service = "Gigconnect chat"

def groovyMethods

pipeline {
    agent {
        label 'Jenkins-Agent'
    }

    tools {
        nodejs "NodeJS"
    }

    environment {
        DOCKER_CREDS = credentials('dockerhub')
        SLACK_WEBHOOK_URL = credentials('slack-webhook-url')
        IMAGE_NAME = "karirukeith/gigconnect-chat"
        IMAGE_TAG = "stable-${BUILD_NUMBER}"
        DOCKER_API_VERSION = '1.40'
    }

    stages {
        stage('Clean Up Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Prepare Environment') {
            steps {
                sh "[ -d pipeline ] || mkdir pipeline"
                dir ('pipeline') {
                    git branch: 'main',
                                credentialsId: 'github',
                                url: 'https://github.com/gigconnectportfolio/jenkins-function'
                    script {
                        groovyMethods = load 'functions.groovy'
                    }
                }
                git branch: 'main',
                    credentialsId: 'github',
                    url: 'https://github.com/gigconnectportfolio/gigconnect-chat-service'

            }
        }

        stage('Install Dependencies') {
            steps {
                withCredentials([string(credentialsId: 'github-npm-token', variable: 'NPM_TOKEN')]) {
                    sh '''
                        echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > .npmrc
                        echo "@kariru-k:registry=https://npm.pkg.github.com/" >> .npmrc
                        npm ci
                    '''
                }
            }
        }

        stage('Lint Check') {
            steps {
                sh 'npm run lint:check'
            }
        }

        stage('Code format Check') {
            steps {
                sh 'npm run prettier:check'
            }
        }

        stage('Run Unit Tests') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'github-npm-token', variable: 'NPM_TOKEN')]) {
                    sh '''
                        docker version
                        echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > .npmrc
                        echo "${DOCKER_CREDS_PSW}" | docker login -u "${DOCKER_CREDS_USR}" --password-stdin

                        docker build \
                            --build-arg NPM_TOKEN=${NPM_TOKEN} \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:stable .

                        rm -f .npmrc
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:stable
                    '''
                }
            }
        }

        stage('Cleanup Docker Images') {
            steps {
                sh '''
                    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${IMAGE_NAME}:stable || true
                    docker logout
                '''
            }
        }

        stage("Create New Pods"){
            steps {
                withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: 'minikube', credentialsId: 'jenkins-k8s-token', namespace: '', serverUrl: 'http://host.docker.internal:8443']]) {
                    script {
                        def pods = groovyMethods.findPodsFromName("${namespace}", "${serviceName}")
                        for (pod in pods) {
                            sh "kubectl delete pod ${pod} -n ${namespace}"
                            sh "sleep 6s"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'rm -f .npmrc'
        }
        success {
            script {
                def duration = groovyMethods.durationTime(currentBuild.startTimeInMillis, System.currentTimeMillis())
                def author = groovyMethods.readCommitAuthor()
                def text = "✅ *${service}* build #${BUILD_NUMBER} succeeded in ${duration} by ${author}"

                groovyMethods.notifySlack(
                    text,
                    '#gigconnect-jenkins',
                    [
                        [
                            title: "View Build #${BUILD_NUMBER}",
                            title_link: "${env.BUILD_URL}",
                            color: "good",
                            text: "Created by ${author}",
                            "markdwn_in": ["fields"],
                            fields: [
                                [title: "Duration", value: duration, short: true],
                                [title: "Stage Name", value: "Production", short: true],
                                [title: "Author", value: author, short: true]
                            ]
                        ]
                    ],
                    env.SLACK_WEBHOOK_URL
                )
            }
        }
        failure {
            script {
                def duration = groovyMethods.durationTime(currentBuild.startTimeInMillis, System.currentTimeMillis())
                def author = groovyMethods.readCommitAuthor()
                def text = "❌ *${service}* build #${BUILD_NUMBER} FAILED in ${duration} by ${author}"

                groovyMethods.notifySlack(
                    text,
                    '#gigconnect-jenkins',
                    [
                        [
                            title: "View Build #${BUILD_NUMBER}",
                            title_link: "${env.BUILD_URL}",
                            color: "danger",
                            text: "Failed by ${author}",
                            "markdwn_in": ["fields"],
                            fields: [
                                [title: "Duration", value: duration, short: true],
                                [title: "Stage Name", value: "Production", short: true],
                                [title: "Author", value: author, short: true]
                            ]
                        ]
                    ],
                    env.SLACK_WEBHOOK_URL
                )
            }
        }
    }
}
