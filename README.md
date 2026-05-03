![coverBig](https://github.com/WarsWorld/WarsWorld/assets/96269542/12c971ba-8d27-4a17-9de1-cd60db3c7e82)

# Wars World

WarsWorld is an Advance Wars web-based multiplayer project inspired by [Advance Wars By Web (AWBW)](https://awbw.amarriner.com/) using a modern tech stack.

## How to use accounts and login to WarsWorld as a dev

The following steps are optional, and it's only useful if you want to help with authentication/authorization or you just want to try to login with Discord, GitHub or Google. You also don't need to set up every provider, if you just want to try to login with discord, just follow the directions to setup discord authentication, same with the others. Furthermore you can still login and register users with email and password authentication without following the next steps.

If you want to login with GitHub, Discord or Google you should follow the next steps:

Directions for Github Account:

1 - Open Github, click your icon, and choose `settings`

2 - Scroll down the options on the left panel and click `Developer Settings`

3 - It will bring you to a new page, again on the left click `OAuth Apps`

4 - Click `New OAuth App`

5 - Fill in an Application Name, set the Homepage to `http://localhost:3000`

6 - Set the Authorization Callback URL to `http://localhost:3000/api/auth/callback/github`

7 - Click Register application and open the app

8 - You're given your Github Client ID, copy that and add to your `.env`

9 - On the Github page, click `Generate a new client secret`

10 - Copy this and paste it into `.env` as your Github Client Secret. All Done!

Directions for Discord Account:

- Follow this guide to get the client and secret: [Discord Guide](https://support.heateor.com/discord-client-id-discord-client-secret/)

Directions for Google Account:

- Follow through steps 1 to 3 and 5 to get the client and secret and set up the redirect link: [Google Guide](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid)
