import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import changelogJson from "../../../../../resources/data/changelog.json";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./changelog.component.html",
	styleUrls: ["./changelog.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogComponent implements AfterViewInit, IWindow {
	public changelog: ChangelogEntry[] = changelogJson;

	public title: string = "Changelog";

	public constructor(
		private _changeDetector: ChangeDetectorRef,
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}
}

type Changes = {
	additions: string[];
	modifications: string[];
	removals: string[];
}

type ChangelogEntry = {
	version: string;
	build_date: string;
	changes: Changes;
	notes: string;
}