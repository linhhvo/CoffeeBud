# Deployment
The web UI is hosted at <a href="https://coffeebud-client.fly.dev" target="_blank">CoffeeBud</a>

To test the app, create a new account or log in with username **demo1** and password **dtap** to see the web app with mock data populated.

------
# API Endpoints
Coffeebud server is hosted separately at `https://coffeebud-server.fly.dev`

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

### Habit Rules Configuration Sync

- **GET** `/api/sync/:deviceId/configs`
  - Example response:
  
    ```json
    {
        "code": 200,
        "success": true,
        "data": {
            "user_id": "4c26836b-9422-407a-93c4-d8d034b5a8c3",
            "device_id": "device-3",
            "water_interval": 45,
            "coffee_limit": 6,
            "break_interval": 120,
            "last_update_time": "2026-05-18T08:39:03.249219Z",
            "wakeup_time": "0000-01-01T09:00:00Z",
            "sleep_time": "0000-01-01T22:00:00Z",
            "timezone": "Europe/Helsinki",
            "now_timestamp": "2026-05-22T18:26:13.829309864+03:00"
        }
    }
    ```

### Pet Avatars Sync

- **GET** `/api/sync/:deviceId/avatars/:mood`
  - Response is a 200x200 bitmap file in RGB565 ([Example](https://coffeebud-assets.linhvo.me/default-sad.bmp))
  
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

### Habit Rules Configuration Management
- **GET** `api/configs` - Get habit rules for user
- **POST** `api/configs` - Update habit rules

### Statistics
- **GET** `api/stat/daily` - Get statistics for the requested date
  - Query param: `date` - value needs to be in format `YYYY-MM-DD`
      - Example: `https://coffeebud-server.fly.dev/api/stat/daily?date=2026-05-12`
  - Example response:
      ```json
        {
            "code": 200,
            "success": true,
            "data": {
                "user_id": "00000000-0000-0000-0000-000000000000",
                "date": "2026-05-12T00:00:00Z",
                "total_coffee": 1,
                "avg_break_interval": 117,
                "avg_water_interval": 63,
                "avg_mood": "neutral"
              }
        }
      ```
- **GET** `api/stat/weekly` - Get statistics for the week including requested date
  - Query param: `date` - value needs to be in format `YYYY-MM-DD`
      - Example: `https://coffeebud-server.fly.dev/api/stat/weekly?date=2026-05-12`
- **GET** `api/stat/monthly` - Get statistics for the month including requested date
  - Query param: `date` - value needs to be in format `YYYY-MM-DD`
      - Example: `https://coffeebud-server.fly.dev/api/stat/monthly?date=2026-05-12`
