import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority = import.meta.env.VITE_COGNITO_AUTHORITY;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

export const userManager: UserManager | null = (authority && clientId)
  ? new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: `${window.location.origin}/callback`,
      post_logout_redirect_uri: window.location.origin,
      response_type: 'code',
      scope: 'openid email api/projects.write api/donations.read api/donations.write api/audit.read',
      // Estado de tránsito PKCE
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
      // Cumplimiento Zero Trust (CA-NF11.1): aislado por pestaña, sin persistencia en localStorage
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      // IMPORTANTE COGNITO: evitar petición fallida a /oauth2/userInfo al usar scopes de Resource Server
      loadUserInfo: false,
    })
  : null;

