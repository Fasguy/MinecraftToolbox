import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Renderer2, ViewContainerRef } from '@angular/core';
import { AbstractHostExtender } from '../host-extender/host-extender';

@Component({
	selector: 'input[standard][type=checkbox]',
	templateUrl: './input-checkbox.component.html',
	styleUrls: ['./input-checkbox.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputCheckboxComponent extends AbstractHostExtender {
	@Input()
	public text: string | undefined;

	public constructor(
		private _changeDetector: ChangeDetectorRef,
		viewContainerRef: ViewContainerRef,
		renderer: Renderer2
	) {
		super(viewContainerRef, renderer);
	}

	public override ngAfterViewInit(): void {
		super.ngAfterViewInit();
		this._changeDetector.detach();
	}
}