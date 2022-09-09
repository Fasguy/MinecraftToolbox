import { AfterViewInit, Component, ComponentRef, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { sleep } from 'src/lib/utils';

@Component({
	selector: 'tbx-window',
	templateUrl: './window.component.html',
	styleUrls: ['./window.component.scss']
})
export class WindowComponent<TWindow extends IWindow> implements AfterViewInit {
	private _childComponent!: Type<TWindow>;

	@ViewChild('childView', { read: ViewContainerRef })
	protected childViewTarget!: ViewContainerRef;

	protected title: string = "";

	public selfRef!: ComponentRef<WindowComponent<TWindow>>;

	public async ngAfterViewInit(): Promise<void> {
		if (this._childComponent) {
			let window = this.childViewTarget.createComponent(this._childComponent);
			// Setting the title immediately makes angular throw a changed after checked error
			await sleep(0);
			this.title = window.instance.title;
		}
	}

	public createChildComponent(component: Type<TWindow>) {
		return this._childComponent = component;
	}

	public close() {
		this.selfRef.destroy();
	}
}

export interface IWindow {
	title: string;
}