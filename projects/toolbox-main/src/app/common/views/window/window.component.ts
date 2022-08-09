import { AfterViewInit, Component, ComponentRef, ElementRef, Type, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
	selector: 'tbx-window',
	templateUrl: './window.component.html',
	styleUrls: ['./window.component.scss']
})
export class WindowComponent implements AfterViewInit {
	private _childComponent!: any;

	@ViewChild('childView', { read: ViewContainerRef })
	public childViewTarget!: ViewContainerRef;

	public selfRef!: ComponentRef<WindowComponent>;

	constructor(
		private _ref: ElementRef<HTMLElement>
	) {
	}

	ngAfterViewInit(): void {
		if (this._childComponent) {
			this.childViewTarget.createComponent(this._childComponent);
		}
	}

	public createChildComponent(component: Type<Component>) {
		if (this.childViewTarget) {
			this.childViewTarget.createComponent(component);
		} else {
			this._childComponent = component;
		}
	}

	public close() {
		this.selfRef.destroy();
	}
}