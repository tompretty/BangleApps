import { AppState, AppStateWithLog } from './state';

declare var require: any;

function initLog(state: AppState): AppStateWithLog {
  const datetime = new Date().toISOString().replace(/[-:]/g, '');
  const date = datetime.substr(2, 6);
  const time = datetime.substr(9, 6);
  const filename = `banglerun_${date}_${time}`;
  return {
    ...state,
    file: require('Storage').open(filename, 'w'),
    fileWritten: false,
  } as AppStateWithLog;
}

function updateLog(state: AppStateWithLog): void {
  if (!state.fileWritten) {
    state.file.write(
      [
        'timestamp',
        'latitude',
        'longitude',
        'altitude',
        'duration',
        'distance',
        'heartrate',
        'steps',
      ].join(',') + '\n'
    );
    state.fileWritten = true;
  }
  state.file.write(
    [
      Date.now().toFixed(0),
      state.lat.toFixed(6),
      state.lon.toFixed(6),
      state.alt.toFixed(2),
      state.duration.toFixed(0),
      state.distance.toFixed(2),
      state.hr.toFixed(0),
      state.steps.toFixed(0),
    ].join(',') + '\n'
  );
}

export { initLog, updateLog };
