const TOKEN = 'p6UsAa8BT0mdz0sgdykIJcEXhixcDY5DSPKEle0mO5XwO6R39g4y4gFIhPGbLPbgu9sEt7z80oPkc2btggKfYRajOtExvO8HxJzjuJvM0o952AeMiEak7SXVCEFZ7kMgvKCOHYxYReWMkGMHsJQQkvRTcewBKSgHHW0HJ6Dz6298yeiR8AKgfhH30weFEHlJSgGrg9t3';
const URL = 'http://localhost:3000/metadata/update'

fetch(URL,{
    method: 'POST',
    body: JSON.stringify({
        token: TOKEN
    })
}).then(() => console.log('Backend Updated'));