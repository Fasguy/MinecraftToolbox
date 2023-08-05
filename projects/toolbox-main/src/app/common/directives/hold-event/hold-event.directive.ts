import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
	selector: '[holdEvent]'
})
export class HoldEventDirective {
	private _holdInterval: any;

	@Output()
	protected hold = new EventEmitter();

	@HostListener('pointerdown')
	private onPointerDown() {
		this._holdInterval = setInterval(() => {
			this.hold.emit();
		}, 16);
	}

	@HostListener('pointerup')
	private onPointerUp() {
		clearInterval(this._holdInterval);
	}
}