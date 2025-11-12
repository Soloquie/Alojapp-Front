import { TestBed } from '@angular/core/testing';

import { HostDashboard } from './host-dashboard';

describe('HostDashboard', () => {
  let service: HostDashboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostDashboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
