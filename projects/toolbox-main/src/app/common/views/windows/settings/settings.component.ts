import { AfterViewInit, ChangeDetectorRef, Component } from "@angular/core";
import { ToolboxOption, ToolboxSettingsService } from "src/app/common/services/toolbox-settings/toolbox-settings.service";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"]
})
export class SettingsComponent implements AfterViewInit, IWindow {
	public title: string = "Settings";

	protected get options(): ToolboxOption[] {
		return Object.values<ToolboxOption>(this._settings.options);
	}

	public constructor(
		private _settings: ToolboxSettingsService,
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}

	protected getOptionValue(option: ToolboxOption): string {
		return option.behaviourSubject.getValue();
	}

	protected setOptionValue(option: ToolboxOption, event: Event): void {
		if (!(event.target instanceof HTMLInputElement)) return;

		switch (event.target.type) {
			case "checkbox":
				option.behaviourSubject.next(event.target.checked);
				break;
		}

		this._settings.save();
	}
}