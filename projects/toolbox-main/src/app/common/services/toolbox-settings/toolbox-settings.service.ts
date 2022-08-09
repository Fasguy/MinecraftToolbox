import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, skip } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ToolboxSettingsService {
	private static readonly STORAGE_KEY = "tbx_settings";

	private _options: ToolboxOptions | any = {
		uselessVisualsEnabled: {
			behaviourSubject: new BehaviorSubject(true),
			text: "Useless visuals enabled",
			description: `Useless visuals are visual elements that are not necessary for the application to work properly.
			This includes things like the background panorama, the title splash text, etc.

			Disabling this option may increase performance, reduce memory usage and prevent network requests for these elements.`
		}
	};

	public get options(): ToolboxOptions {
		return this._options;
	}

	constructor(
		private route: ActivatedRoute
	) {
		this.load();

		this.route.queryParams
			.pipe(skip(1))
			.subscribe(params => {
				//Blame JavaScript for this garbage.
				function boolean(value: string) {
					switch (value.toLowerCase()) {
						case "true":
						case "1":
						case "yes":
							return true;
						default:
							return false;
					}
				}

				for (const [key, value] of Object.entries<ToolboxOption>(this._options)) {
					if (params[key] != void (0)) {
						value.behaviourSubject.next(boolean(params[key]));
					}
				}
			});
	}

	public toJSON() {
		let json: any = {};

		for (const [key, value] of Object.entries<ToolboxOption>(this._options)) {
			json[key] = value.behaviourSubject.value;
		}

		return json;
	}

	public save = () => {
		localStorage.setItem(ToolboxSettingsService.STORAGE_KEY, JSON.stringify(this));
	}

	private load = () => {
		let json: any = JSON.parse(localStorage.getItem(ToolboxSettingsService.STORAGE_KEY) ?? "{}");

		for (const [key, value] of Object.entries(json)) {
			let option = this._options[key];
			if (option != void (0)) {
				option.behaviourSubject.next(value);
			}
		}
	}

	public Observe = {
		uselessVisualsEnabled: (<BehaviorSubject<boolean>>this._options.uselessVisualsEnabled.behaviourSubject).asObservable()
	}
}

export type ToolboxOptions = Object & {
	[key: string]: ToolboxOption;
}

export type ToolboxOption = {
	behaviourSubject: BehaviorSubject<any>;
	text: string;
	description: string;
}