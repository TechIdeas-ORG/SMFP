#define CHAVPIN 7
int qtdePessoas = 0;
void setup()
{  
  pinMode(CHAVPIN, INPUT);
  Serial.begin(9600);
}
void loop()
{

  int chave = digitalRead(7);
  if (chave == 0)
  {
    Serial.println("1");
    while(chave == 0){
        qtdePessoas = qtdePessoas + 1;
        chave = digitalRead(7);
        if(chave == 1){
            break;
        }
    }
    Serial.println(chave);
  }
  else
  {
    Serial.println("0");
  }
  }
