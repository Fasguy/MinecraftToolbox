import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import changelogJson from "../../../../../resources/data/changelog.json";
import { IWindow } from '../../window/window.component';

@Component({
	templateUrl: './changelog.component.html',
	styleUrls: ['./changelog.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangelogComponent implements OnInit, IWindow {
	public changelog: ChangelogEntry[] = changelogJson;

	public title: string = "Changelog";

	constructor(
		private _changeDetector: ChangeDetectorRef,
	) {
		_changeDetector.detach();
	}

	public ngOnInit(): void {
		this._changeDetector.detectChanges();
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