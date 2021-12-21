import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJOl5O+Ee983RUMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi03cmJlOW84Ni51cy5hdXRoMC5jb20wHhcNMjExMjE4MTEyMTU0WhcN
MzUwODI3MTEyMTU0WjAkMSIwIAYDVQQDExlkZXYtN3JiZTlvODYudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwiWIMDuZlLutrhzy
mZhcOuOCk94F09MAK508z5pvZARUOnS6lwx+UPywRXbanFYLwKTR6vOZnICL3WiK
L0nopLn/tPnJh3ZEEIZBwEyq9hMQR5MBfLuUr/lJoGjJbxgz8sKDDx9vZIWJWbUf
mdfWRNMTDa9/fKE6Gn6cC8ifUto/kC0ZHTrdDqr8G+il5CIeqe0EpuLoHfHgwkor
C5ouygXfH0HF/73miI1jnkaPHROKqvY3V26w1afLH1o+Mowxid2hUA3KG0kd6xWB
VDYIWnB8ioLow2B8DbhwwsCNaSIvJpqA4ILwIexcJ+0gUiV7dloVwNBY0wVqoxVR
wFStSwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRfffqM2jBe
Ir052UrbYEgjXWhY3TAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
ABd3hCENWd0hf3WkIaJLa+mFq94/hGYKMk8A0OGExws+olB/aC0h5vPZHYj5HwRi
FTTQGterIMKE7AsihlgVJzNcTs3loK4ZQTY5DLzGzZC0VSGbbdfJB/LcJxKwAi23
dWr8dumFMp9WVuhnuxqk8t7RDQkJl3wdT0l05eFhogwho1Qexn0WXMV+M1Z2rkEN
Kg1hILI7q2xsirjqy2xgt9e587j7QVbHuJY5N7xJmkgiWMBWSQ48/2ZA3Iy9DirR
On4OKhedr61kRJvNuxr3FkD2K4fb99k+aFZ+gCPNLW2SgriORCQ4M22oY3/mbKYh
mlfUw8tNRAgHI5MeIKF0IsE=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function verifyToken(authHeader: string): JwtPayload {
  const token = getToken(authHeader)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
