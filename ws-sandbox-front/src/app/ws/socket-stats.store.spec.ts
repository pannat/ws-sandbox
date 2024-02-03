import { TestBed } from '@angular/core/testing';

import { SocketStatsStore } from './socket-stats.store';

describe('SocketStatsStoreTsService', () => {
  let service: SocketStatsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketStatsStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
