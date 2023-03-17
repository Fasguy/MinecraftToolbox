import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from "@angular/core";
import { AssetManagerService } from "src/app/common/services/asset-manager/asset-manager.service";

@Component({
	selector: "tbx-selection",
	templateUrl: "./selection.component.html",
	styleUrls: ["./selection.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectionComponent implements OnChanges {
	private _entries: EntryGroup[] = [];

	public get entries() {
		return this._entries;
	}

	@Input()
	public set entries(value: EntryGroup[]) {
		this._entries = value;
		this._changeDetectorRef.detectChanges();
	}

	@Input()
	public name: string = "";

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		public assetManagerService: AssetManagerService
	) {
		this._changeDetectorRef.detach();
	}

	public changeEntireGroup(group: HTMLElement, groupCheckbox: HTMLInputElement) {
		let groupCheckboxes = group.querySelectorAll<HTMLInputElement>(".entry > label > input[type=checkbox]");
		let checked = groupCheckbox.checked;
		for (const checkbox of groupCheckboxes) {
			checkbox.checked = checked;
		}
	}

	public groupItemChanged(group: HTMLElement, groupCheckbox: HTMLInputElement) {
		let groupCheckboxes = group.querySelectorAll<HTMLInputElement>(".entry > label > input[type=checkbox]");
		let initialState = groupCheckboxes[0]?.checked;
		for (const checkbox of groupCheckboxes) {
			if (initialState !== checkbox.checked) {
				groupCheckbox.indeterminate = true;
				return;
			}
		}

		groupCheckbox.indeterminate = false;
		groupCheckbox.checked = initialState;
	}

	public toggleEntries(entryContainer: HTMLElement) {
		entryContainer.classList.toggle("collapsed");
	}

	/*
	 * This section is a REALLY ugly hack.
	 * A group's checkbox doesn't get updated until atleast one item gets changed.
	 * I'm not aware of a better way to do this, but if you know a better way, then PLEASE go ahead and implement it.
	*/
	private _groups: [HTMLElement, HTMLInputElement][] = [];

	protected pushGroup(group: HTMLElement, groupCheckbox: HTMLInputElement) {
		this._groups.push([group, groupCheckbox]);

		return false;
	}

	public ngOnChanges(): void {
		for (const [group, groupCheckbox] of this._groups) {
			this.groupItemChanged(group, groupCheckbox);
		}

		this._groups.length = 0;
	}
}

export interface EntryGroup {
	title: string;
	entries: Entry[];
}

export interface Entry {
	text: string;
	value: string;
	checked: boolean;
}