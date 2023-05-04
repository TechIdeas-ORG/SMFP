const serialport = require('serialport');
const express = require('express');
const mysql = require('mysql2');
//Aqui ele esta pedidno as APIS necessaias

const SERIAL_BAUD_RATE = 9600;
const SERVIDOR_PORTA = 3000;
const HABILITAR_OPERACAO_INSERIR = false;
//  definindo quais vao ser as portar que ira se conectar com o arduino
//e definindo as portas locais
const serial = async (
    valoresDht11Umidade,
    valoresDht11Temperatura,
    valoresLuminosidade,
    valoresLm35Temperatura,
    valoresChave
    // criado a const para salvar o valor de cada sensor
) => {
    const poolBancoDados = mysql.createPool(
        {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'urubu100',
            database: 'metricas'
            // aqui esta criando a conexao com o banco de dados
        }
    ).promise();

    const portas = await serialport.SerialPort.list();
    // essa constante esta esperando um porta serial para listala
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
    //esta constante esta verificando se tem um arduino conectado
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
        //caso nao tenha nenhum arduino ligado ira aparecer esta mensagem de erro
    }
    const arduino = new serialport.SerialPort(
        {
            path: portaArduino.path,
            baudRate: SERIAL_BAUD_RATE
        }
        //essa constante que vai conter o caminho da porta do arduíno e 
        // definir a velocidade de processamento usando o valor do Serial_Baud_Rate
    );
    arduino.on('open', () => {
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
        //aqui caso o arduino seja conectado ira enviar uma mensagem para o console
        //informando que foi conectado e irformara o caminho do arduino e a velocidade
        //de processamento
    });
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        //Nesse trecho, ele está criando uma conexão com o arduíno(.pipe)
        //, vai ler as linhas do arduíno(.ReadlineParser), definir uma 
        //delimitação(‘\r\n’) como se fosse um <br> 
        const valores = data.split(';');
        //vai dividir as informacoes vindas do arduino por um ponto e virgula
        const dht11Umidade = parseFloat(valores[0]);
       const dht11Temperatura = parseFloat(valores[1]);
       const luminosidade = parseFloat(valores[2]);
        const lm35Temperatura = parseFloat(valores[3]);
        const chave = parseInt(valores[4]);
        //vai pegar os valores e colocalos onde esta os (valores[])

        valoresDht11Umidade.push(dht11Umidade);
        valoresDht11Temperatura.push(dht11Temperatura);
        valoresLuminosidade.push(luminosidade);
        valoresLm35Temperatura.push(lm35Temperatura);
        valoresChave.push(chave);
        // Vai pegar os valores da chave e manda-los par auma lista JSON

        if (HABILITAR_OPERACAO_INSERIR) {
            await poolBancoDados.execute(
                'INSERT INTO sensores (dht11_umidade, dht11_temperatura, luminosidade, lm35_temperatura, chave) VALUES (?, ?, ?, ?, ?)',
                [dht11Umidade, dht11Temperatura, luminosidade, lm35Temperatura, chave]
            );
            //Nessa parte, vai ser inserido os valores no banco de dados
        }

    });
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
        // caso tenha algum erro ira aparecer no console
    });
}

const servidor = (
    valoresDht11Umidade,
    valoresDht11Temperatura,
    valoresLuminosidade,
    valoresLm35Temperatura,
    valoresChave
) => {
    const app = express();
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
        
    });
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });
    app.get('/sensores/dht11/umidade', (_, response) => {
        return response.json(valoresDht11Umidade);
    });
    app.get('/sensores/dht11/temperatura', (_, response) => {
        return response.json(valoresDht11Temperatura);
    });
    app.get('/sensores/luminosidade', (_, response) => {
        return response.json(valoresLuminosidade);
    });
    app.get('/sensores/lm35/temperatura', (_, response) => {
        return response.json(valoresLm35Temperatura);
    });
    app.get('/sensores/chave', (_, response) => {
        return response.json(valoresChave);
    });
}//Aqui está sendo criada uma constante chamada servidor,
// nela tem os valores da chave, e ela está permitindo o acesso do 
//servidor para qualquer dispositivo, também é feita a leitura da porta
// do servidor, caso a leitura seja executada será mandado no console
// uma mensagem dizendo que a API foi executada com sucesso junto com a
// especificação da porta, ele também imprime os valores na página do 
//navegador.


(async () => {
    const valoresDht11Umidade = [];
    const valoresDht11Temperatura = [];
    const valoresLuminosidade = [];
    const valoresLm35Temperatura = [];
    const valoresChave = [];
    await serial(
        valoresDht11Umidade,
        valoresDht11Temperatura,
        valoresLuminosidade,
        valoresLm35Temperatura,
        valoresChave
    );
    servidor(
        valoresDht11Umidade,
        valoresDht11Temperatura,
        valoresLuminosidade,
        valoresLm35Temperatura,
        valoresChave
    );
 //Por fim, nessa parte do código está sendo criada uma função 
 //assíncrona que vai criar a lista de valores da chave. Além de chamar
 //a leitura do serial e a criação do servidor.


})();
