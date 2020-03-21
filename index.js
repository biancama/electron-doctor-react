const electron = require('electron');
const fs = require('fs');
const {app, BrowserWindow, Menu, ipcMain} = electron;
const { v4: uuidv4 } = require('uuid');


let allAppointments = [];
fs.readFile("db.json", (err, jsonAppointments) => {
    if (!err) {
      const oldAppointments = JSON.parse(jsonAppointments);
      allAppointments = oldAppointments;
    }
  });

const createWindow = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true
        },
        title: "Doctor Appointments"
    });

    mainWindow.setMenu(null);
    const startUrl = process.env.ELECTRON_START_URL || `file://${__dirname}/build/index.html`;
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', () => {
        const jsonAppointments = JSON.stringify(allAppointments);
        fs.writeFileSync("db.json", jsonAppointments);
        app.quit();        
        mainWindow = null;
    });

    if (process.env.ELECTRON_START_URL) {
        const mainMenu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(mainMenu);
    } else {
        Menu.setApplicationMenu(null);
    }
};


const menuTemplate = [
    {
        label: "View",
        submenu: [
            {
                role: "reload"
            },  
            {
                role: "toggledevtools"
            },                          
        ]
    },
];

/////////////////////////   Events //////////////////////////
ipcMain.on('appointment:create', (event, appointment) => {
    console.log("I'm here");

    appointment['id'] = uuidv4();
    appointment['done'] = 0;
    allAppointments.push(appointment);

});

ipcMain.on('appointment:request:list', event => {
    console.log("sending appointments" + allAppointments);
    mainWindow.webContents.send('appointment:response:list', allAppointments);
});

ipcMain.on('appointment:request:today', event => {
    sendTodayAppointments();
});

const sendTodayAppointments = () => {
    const today = new Date().toISOString().slice(0, 10);
    const filteredAppointments = allAppointments.filter(appointment => appointment.date === today);
    mainWindow.webContents.send('appointment:response:today', filteredAppointments);
}

ipcMain.on('appointment:done', (event, id) => {
    allAppointments.forEach(app => {
        if (app.id === id) app.done = 1;
    });
    sendTodayAppointments();
});

app.on ('ready', createWindow);