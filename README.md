# API Endpoints
Coffeebud server is \*temporarily\* hosted on Fly.io at `https://coffeebud-server.fly.dev`

### Example Requests
```bash
# Device pairing
curl -X POST "https://coffeebud-server.fly.dev/api/sync/DEV-0001?battery=50" \
                                 -i -H "Content-Type: application/json"

# Data sync
curl -X PUT "https://coffeebud-server.fly.dev/api/sync/DEV-0001?battery=80" \
                                 -i -H "Content-Type: application/json" \
                                 -d '[
                                        {
                                          "type": "water",
                                          "timestamp": "2024-04-30T17:24:56Z"
                                        },
                                        {
                                          "type": "coffee",
                                          "timestamp": "2024-04-30T17:24:56Z""
                                        }
                                      ]' \
 
```
## Physical Device

### Device Pairing

- **POST** `/api/sync/:deviceId`
    - Query param: `battery` - value needs to be `int`
    - Body: Empty
    - Response:

      | Code  | Description                                                     |   
      | ----- | --------------------------------------------------------------- |
      | `201` | Pairing started, awaiting user action                           |
      | `202` | Pairing confirmed                                               |
      | `400` | In most cases, parameters are not in the expected format        |
      | `500` | Server can't complete the action. Likely problems with database |

### Activity Event Sync

- **PUT** `/api/sync/:deviceId`
    - Query param: `battery` - value needs to be an int
    - Body: list of activity event JSON.
        - Action type needs to be one of: `coffee`, `water`, `break`
        - Timestamp needs to be in [RFC3339](https://www.rfc-editor.org/rfc/rfc3339.html) format

    - Reponse:

      | Code  | Description                                                              |   
      | ----- | ------------------------------------------------------------------------ |
      | `200` | Data updated successfully                                                |
      | `400` | In most cases, parameters or request body are not in the expected format |
      | `404` | Device is not connected to an user account                               |
      | `500` | Server can't complete the action. Likely problems with database          |

    - Custom headers:

      | Header              | Value      | Description                                         |
      | ------------------- | ---------- | --------------------------------------------------- |  
      | `Rules-Need-Update` | "0" or "1" | Habit rules have changed since last sync            |
      | `Pet-Need-Update`   | "0" or "1" | Pet avatar or pet name have changed since last sync | 

### Habit Rules Sync *(wip)*

- **GET** `/api/sync/:deviceId/habit-rules` 

### Pet Details Sync *(wip)*

- **GET** `/api/sync/:deviceId/pet`
  
## Authorization

- **POST** `/api/auth/register`
    - Body:
        ```json
        {
            "username": "user1",
            "password": "password"
        }
        ```
    - Response:

      | Code  | Description                                                                         |   
      | ----- | ----------------------------------------------------------------------------------- |
      | `200` | User created successfully                                                           |
      | `400` | In most cases, request body is not in the expected format                           |
      | `409` | Username already exists                                                             |
      | `500` | Server can't complete the action. Likely problems with database or password hashing |
      
- **POST** `/api/auth/login`
    - Body:
        ```json
        {
            "username": "user1",
            "password": "password"
        }
        ```
   - Response:
     
      | Code  | Description                                                                         |
      | ----- | ----------------------------------------------------------------------------------- |
      | `200` | User logs in successfully                                                           |
      | `400` | In most cases, request body is not in the expected format                           |
      | `404` | Username doesn't exist                                                              |
      | `401` | Invalid password                                                                    |
      | `500` | Server can't complete the action. Likely problems with setting session cookie       |

- **POST** `/api/auth/logout`

## Endpoints that require authentication token
### Device Management
- **POST** `/api/devices/pair/:deviceId` - Connect device with user account
- **DELETE** `/api/devices/:deviceId` - Remove device from user account
### Activity Management
- **GET** `api/activities` - Get activity events for user
### Habit Rules Management
- **GET** `api/habit-rules` - Get habit rules for user
- **POST** `api/habit-rules` - Update habit rules
    
