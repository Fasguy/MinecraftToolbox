import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { ToolboxOption, ToolboxSettingsService } from 'src/app/common/services/toolbox-settings/toolbox-settings.service';

@Component({
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements AfterViewInit {
	public get options(): ToolboxOption[] {
		return Object.values<ToolboxOption>(this._settings.options);
	}

	constructor(
		private _settings: ToolboxSettingsService,
		private _changeDetector: ChangeDetectorRef
	) {
		_changeDetector.detach();
	}

	ngAfterViewInit(): void {
		this._changeDetector.detectChanges();
	}

	public getOptionValue(option: ToolboxOption): string {
		return option.behaviourSubject.getValue();
	}

	public setOptionValue(option: ToolboxOption, event: Event): void {
		if(!(event.target instanceof HTMLInputElement)) return;

		switch(event.target.type) {
			case "checkbox":
				option.behaviourSubject.next(event.target.checked);
				break;
		}

		this._settings.save();
	}
}