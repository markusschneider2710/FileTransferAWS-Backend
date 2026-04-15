import * as cdk from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';


//todos:
//statisch page hosten
//jedem user eigener Folder -> funktioniert nur bedingt
//Navigation
//Pop-UP beim Uploaden


export class AmplifybackendtestmarkusStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //Storage Bucket
    const amplifybucket = new Bucket (this, 'StorageBucket', {
          bucketName: "markusfiletransferbucket",
          versioned: true,
          removalPolicy: cdk.RemovalPolicy.DESTROY, 
          autoDeleteObjects: true, 
        });


    //gibt der HTTP die Möglichkeit den S3 zu bearbeiten 
    amplifybucket.addCorsRule({
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
        s3.HttpMethods.HEAD
      ],
      allowedOrigins: ['http://localhost:5173'],  
      allowedHeaders: ['*'],
      exposedHeaders: [
      'ETag',
      'x-amz-request-id',
      'x-amz-id-2',
      'x-amz-meta-custom-header'
      ],
      maxAge: 3000,
      });


    //erstellt einen User Pool, dieser sammelt alle User die sich selbst regristrieren 
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'PersonalFileStorageUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
    });

    //Ein Pre-Sign-Up damit NUR Personen aus der Fielmann Group AG sich anmelden können
    const preSignupLambda = new NodejsFunction (this, 'PreSignupLambda', {
      entry: 'lambdas/lambdasignup.tsx',
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(10),
    });

    userPool.addTrigger (
      cognito.UserPoolOperation.PRE_SIGN_UP,
      preSignupLambda
    );


    //erstellt einen Client für den User um im frontend genutzt zu werden
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
    });

    //weißt angemeldeten Usern AWS-Ressourcen zu
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', { 
      identityPoolName: 'PersonalFileStorageIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });
    
    //IAM Rolle bestimmen
    const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          'StringEquals': { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });
    
    //IAM Rolle Berechtigungen
    authenticatedRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject', 's3:ListBucket'],
      resources: [
        amplifybucket.bucketArn,
        `${amplifybucket.bucketArn}/*`,
        `${amplifybucket.bucketArn}/public/*`
      ],
    }));
    
    //Verbindet identityPool mit den IAM Rollen
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    //Ausgabe
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'S3BucketName', { value: amplifybucket.bucketName });
  }
}


