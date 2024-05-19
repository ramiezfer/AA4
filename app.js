const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const url = 'mongodb+srv://dako9804:wQKuNQEPwhxRG9N1@clustertest.ti1sg5e.mongodb.net/?retryWrites=true&w=majority&appName=Clustertest'
const app = express()
const hostname = process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost';
console.log('Hostname: ', hostname)
const port = process.env.PORT || 10000;
console.log('Port: ', port)
const secretKey = "c1443354-1991-4072-a980-3589844b649a"
mongoose.connect(url)
    .then(() => console.info('CONECTADO A MONGO'))
    .catch((e) => console.error('El error de conexion es: ', e.message))

const personaSchema = mongoose.Schema({
    codigo: Number,
    nombre: String,
    nota: Number,
    ciudad: String
})
const usuarioSchema = mongoose.Schema({
    username: String,
    password: String
})
const PersonaModel = mongoose.model('personas', personaSchema)
const UsuarioModel = mongoose.model('usuarios', usuarioSchema)
app.use(cors())
app.use(express.json())
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};
app.get('/Form.html', (req, res) => {
    res.sendFile(__dirname + '/Form.html');
});

//Ruta para registrar nuevos usuarios
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const userExists = await UsuarioModel.findOne({ username });
    if (userExists) {
        return res.status(400).send('El usuario ya existe.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UsuarioModel({ username, password: hashedPassword });
    try {
        await newUser.save();
        res.status(201).send('Usuario registrado exitosamente.');
    } catch (err) {
        res.status(400).send('Error al registrar usuario.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await UsuarioModel.findOne({ username });
    if (!user) {
        return res.status(400).send('Usuario o contraseña incorrectos.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).send('Usuario o contraseña incorrectos.');
    }

    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

    res.json({ token });
});
app.get('/obtenerAlumnos', authenticateToken, async (req, res) => {
    try {
        const alumnos = await PersonaModel.find();
        console.log(alumnos)
        res.json(alumnos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/crearAlumno', authenticateToken, async (req, res) => {
    const alumno = new PersonaModel({
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        nota: req.body.nota,
        ciudad: req.body.ciudad,
    });
    try {
        const nuevoAlumno = await alumno.save();
        res.status(201).json(nuevoAlumno);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/actualizarAlumno/:codigo', authenticateToken, async (req, res) => {
    try {
        const codigoAlumno = req.params.codigo;
        const actualizacion = req.body; // Suponemos que req.body contiene los campos a actualizar

        const alumnoActualizado = await PersonaModel.findOneAndUpdate({ codigo: codigoAlumno }, actualizacion, { new: true });

        if (!alumnoActualizado) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        res.json({ message: 'Alumno actualizado', alumno: alumnoActualizado });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.delete('/eliminarAlumno/:codigo', authenticateToken, async (req, res) => {
    try {
        const codigoAlumno = req.params.codigo;
        const alumnoEliminado = await PersonaModel.findOneAndDelete({ codigo: codigoAlumno });

        if (!alumnoEliminado) {
            return res.status(404).json({ message: 'Alumno no encontrado' });
        }

        res.json({ message: 'Alumno eliminado', alumno: alumnoEliminado });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Inicia el servidor
app.listen(port, () => { console.log(`Servidor iniciado en el puerto ${port}`); });
