import { ConfigService } from './config.service';
import { ModalService } from './modal.service';
import { AuthService } from './auth.service';
import { LoaderService } from './loader.service';
import { GoogleTagManagerService } from './google-tag-manager.service';

export { ConfigService, ModalService, AuthService, LoaderService, GoogleTagManagerService };

export const CORE_SERVICES = [
  ConfigService, ModalService, AuthService, LoaderService, GoogleTagManagerService
];
