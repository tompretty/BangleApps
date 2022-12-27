const Layout = require("Layout");
const Storage = require("Storage");

class App {
  constructor() {
    this.scene = new MenuScreen(this);
  }

  start() {
    g.clear();
    this.scene.render();
  }

  changeScreen(scene) {
    this.scene.exit();

    this.scene = scene;
    this.scene.enter();

    g.clear();
    this.scene.render();
  }
}

class Screen {
  constructor(app) {
    this.app = app;
    this._layout = null;
  }

  enter() {}

  exit() {}

  render() {
    this.layout.render();
  }

  get layout() {
    if (!this._layout) {
      this._layout = this.createLayout();
    }
    return this._layout;
  }

  createLayout() {}
}

class MenuScreen extends Screen {
  createLayout() {
    return new Layout(
      {
        type: "v",
        halign: -1,
        c: [
          {
            type: "btn",
            label: "-> work",
            cb: () =>
              this.app.changeScreen(
                new RecordingScreen(
                  this.app,
                  ["->", "WA", "WD", "HA", "HD", "<-"],
                  "commute.data.to-work.csv"
                )
              ),
            font: "6x8:3",
            halign: -1,
          },
          { height: 5 },
          {
            type: "btn",
            label: "<- work",
            cb: () =>
              this.app.changeScreen(
                new RecordingScreen(
                  this.app,
                  ["->", "CD", "HA", "HD", "WA", "<-"],
                  "commute.data.to-work.csv"
                )
              ),
            font: "6x8:3",
            halign: -1,
          },
        ],
      },
      { lazy: true }
    );
  }
}

class RecordingScreen extends Screen {
  constructor(app, stages, saveFile) {
    super(app);
    this.stages = stages;
    this.saveFile = saveFile;

    this.recordings = [];

    this.interval = null;
    this.watch = null;
  }

  enter() {
    this.interval = setInterval(() => this.updateTime(), 1000);
    this.watch = setWatch((e) => this.onButtonPressed(e), BTN, {
      repeat: true,
      edge: -1,
    });
  }

  exit() {
    clearInterval(this.interval);
    clearWatch(this.watch);
  }

  updateTime() {
    const time = getDisplayTime(new Date());
    this.layout.time.label = time;
    this.layout.render();
  }

  onButtonPressed(e) {
    if (e.time - e.lastTime > 0.75) {
      this.goBackOneStage();
    } else {
      this.goForwardOneStage();
    }
  }

  goBackOneStage() {
    if (this.recordings.length == 0) {
      this.app.changeScreen(new MenuScreen(this.app));
      return;
    }

    this.recordings.pop();

    const removedStageIndex = this.recordings.length;
    const removedStageId = `stage${removedStageIndex}`;
    const removedStageLabel = `${this.stages[removedStageIndex]}      `;

    this.layout[removedStageId].label = removedStageLabel;
    this.layout.render();
  }

  goForwardOneStage() {
    const recording = new Date();
    this.recordings.push(recording);

    const newStageIndex = this.recordings.length - 1;
    const newStageId = `stage${newStageIndex}`;
    const newStageLabel = `${this.stages[newStageIndex]} ${getDisplayTime(
      recording
    )}`;

    this.layout[newStageId].label = newStageLabel;
    this.layout.render();

    if (this.recordings.length === this.stages.length) {
      this.saveRecordings();
      this.app.changeScreen(
        new SummaryScreen(
          this.app,
          this.recordings[0],
          this.recordings[this.recordings.length - 1]
        )
      );
    }
  }

  saveRecordings() {
    const file = Storage.open(this.saveFile, "a");

    const isos = this.recordings.map((r) => r.toISOString());
    const data = isos.join(",") + "\n";

    file.write(data);
  }

  createLayout() {
    const stageTxts = this.stages.map((s, i) => ({
      type: "txt",
      font: "6x8:2",
      label: `${s}      `,
      halign: -1,
      id: `stage${i}`,
    }));

    return new Layout(
      {
        type: "v",
        halign: -1,
        c: stageTxts.concat([
          { height: 5 },
          {
            type: "txt",
            font: "6x8:4",
            label: getDisplayTime(new Date()),
            halign: -1,
            id: "time",
          },
        ]),
      },
      { lazy: true }
    );
  }
}

class SummaryScreen extends Screen {
  constructor(app, startTime, endTime) {
    super(app);
    this.startTime = startTime;
    this.endTime = endTime;
  }

  createLayout() {
    const deltaS = Math.floor((this.endTime - this.startTime) / 1000);

    const mins = Math.floor(deltaS / 60) % 60;
    const hours = Math.floor(deltaS / 3600);

    return new Layout(
      {
        type: "v",
        halign: -1,
        c: [
          {
            type: "txt",
            label: "It took",
            font: "6x8:2",
            halign: -1,
          },
          { height: 5 },
          {
            type: "txt",
            label: `${pad(hours)} hrs`,
            font: "6x8:4",
            halign: -1,
          },
          {
            type: "txt",
            label: `${pad(mins)} mins`,
            font: "6x8:4",
            halign: -1,
          },
        ],
      },
      { lazy: true }
    );
  }
}

function getDisplayTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${pad(hours)}:${pad(minutes)}`;
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

new App().start();
