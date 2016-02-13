# node-tado

This is a Node.js client for the [Tado](https://www.tado.com) smart thermostat web API. It offers a promise-based API.

**Please be aware that this client simply mocks the behaviour of the [Tado Web-App](https://my.tado.com).**
This means that it could stop working due to implemented restrictions by Tado at any time.

 ## Usage

Before you can access any API methods, you must perform a login, using your Tado username and password:

```javascript
import Tado from 'node-tado';

let client = new Tado();
client.login('username', 'password').then((success) => {
  // use the client now
});
```

### api(path)

This method handles all API calls. Currently, only GET requests without any parameters are supported – hence this client is only useful for querying data, not for adjusting settings or anything like that.

```javascript
client.api('/me').then((result) => {
  console.log('me', result);
});
```

There are a few convenience methods:

### me()

Shortcut for `.api('/me')`. Queries data about the logged in user.

### home(homeId)

Shortcut for `.api('/homes/' + homeId)`.

### zones(homeId)

Shortcut for `.api('/homes/' + homeId + '/zones')`. Lists available zones.

### weather(homeId)

Shortcut for `.api('/homes/' + homeId + '/weather')`. Fetches current weather data for the location of the given home.

### state(homeId, zoneId)

Shortcut for `.api('/homes/' + homeId + '/zones/' + zoneId + '/state')`. Fetches current metrics.
