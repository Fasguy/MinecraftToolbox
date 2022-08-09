import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import packageJson from '../../../../package.json';
import { PanoramaService } from './common/services/panorama-service/panorama.service';
import { ToolboxSettingsService } from './common/services/toolbox-settings/toolbox-settings.service';
import { WindowService } from './common/services/window-service/window.service';

@Component({
	selector: 'tbx-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	public title = 'toolbox';
	public version = packageJson.version;

	@ViewChild('windowContainer', { read: ViewContainerRef })
	public target!: ViewContainerRef;

	constructor(
		private toolboxSettings: ToolboxSettingsService,
		private panorama: PanoramaService,
		private _window: WindowService
	) {
	}

	ngAfterViewInit() {
		this._window.windowContainer = this.target;
	}
}