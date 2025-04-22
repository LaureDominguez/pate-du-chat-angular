import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { AdminEntityType, AdminEntity } from '../../../models/admin-types';
import { AdminModule } from '../admin.module';

@Component({
  selector: 'app-mobile-view',
  imports: [AdminModule],
  templateUrl: './mobile-view.component.html',
  styleUrls: ['./mobile-view.component.scss']
})
export class MobileViewComponent<T extends { _id?: string; name?: string }> {
  @Input() items: T[] = [];
  @Input() type: string = '';
  @Input() itemTemplate!: TemplateRef<any>; // 👈 Template injecté depuis le parent

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  expandedItemId: string | null = null;

  toggle(item: T) {
    this.expandedItemId = item._id || null;
  }

  trackById = (_: number, item: T) => item._id;
}
