#include<stdio.h>
#include <string.h>
/*
int main(){
    char* arr=NULL;             //指针可以做++操作
    char buf[10]="abcdf1234";   
    printf("%c\n",*buf);

    arr=buf;
    

    getchar();
    return 0;
}
*/

/*
//根据逗号截取字符串
int main()
{
    char str[] = "now , is the time for all , good men to come to the , aid of their country";
    char delims[] = ",";
    char *result = NULL;
    result = strtok( str, delims );
    while( result != NULL ) {
        printf( "result is \"%s\"\n", result );
        result = strtok( NULL, delims );
    }
    getchar();
}
*/

/*
//字符串截取
void my_strtok(char * str,char* delims)
{
    //char str[] = "+CESQ: 36,0,255,255,14,54";
    //char delims[] = ",";
    char *result = NULL;
    result = strtok( str, delims );
    printf( "result is %s\n", result );
    printf( "result is %s\n", result+ 7);
    //str=result+7; 直接赋值结果不正确(可能是局部变量与全局变量地址有关)
    strcpy(str,result+7);

}

//根据逗号截取字符串
int main()
{
    char str[] = "+CESQ: 36,0,255,255,14,54";
    char delims[] = ",";
    my_strtok(str,delims);
    printf(">>%s\n",str);


    getchar();
}
*/




/*
int main(){
    char *str_1 = "wtwq211";
    char *str_2 = strchr(str_1, 'q');   //返回q的地址,查找字符第一次出现的位置
    printf("%s\n", str_2);              //输出:q211
 
    int index=str_2 - str_1;
    printf("%d\n", index);       //输出：q 的下标
    printf("%c\n", str_1[index]);       //输出：'q'


    getchar();
    return 0;
}
*/

/*
int main(){
    const char *str_1 = "+CESQ: 36,0,255,255,14,54";
    char *str_2 = strchr(str_1, ':');   //返回q的地址,查找字符第一次出现的位置
    //printf("%s\n", str_2);              //输出:    : 36,0,255,255,14,54
    //printf("%s\n", str_2+2);              //输出:  36,0,255,255,14,54
 
    char* arr=str_2+2;
    printf("%s\n", arr);
    char *str_3 = strchr(arr, ',');   //返回q的地址,查找字符第一次出现的位置
    int index=str_3 - arr;
    printf("%d\n", index);       //  2

    getchar();
    return 0;

}
*/



//结构体练习，结构体指针，结构体做形参
/*
typedef struct
{
  int  cid;
  int  id;
  char apn[32];
  char locaddr[20];
} pdp_t;

int main(){
    pdp_t data;
    data.cid=100;
    printf("cid:    %d\n",data.cid);
    pdp_t* p=&data;                     //记得要有取址符
    printf("cid:    %d\n",p->cid);
    
    pdp_t* data_1;
    data_1->id=200;
    printf("id:    %d\n",data_1->id);
    

    getchar();
    return 0;
}
*/

typedef struct
{
  int  cid;
  int  id;
  char apn[32];
  char locaddr[20];
} pdp_t;

pdp_t* doit(pdp_t* my_data){
    //memset(&my_data, 0, sizeof(my_data));     //无法正确运行,sizeof求得是指针大小，不是结构体大小
    my_data->cid=200;
    printf("cid:    %d\n",my_data->cid);
    //printf("%d\n",sizeof(my_data));
    return my_data;
}
void doit1(pdp_t* my_data){

    my_data->cid=200;
    printf("cid:    %d\n",my_data->cid);

}



int main(){
    /*
    //有返回值
    pdp_t data;
    memset(&data, 0, sizeof(data));          //这里可以
    pdp_t* p=&data;
    p->cid=100;
    p=doit(&data);
    printf("cid:    %d\n",p->cid);
    */

   //无返回值，直接操作原地址
    pdp_t data1;
    memset(&data1, 0, sizeof(data1));          //结构体初始化
    pdp_t* p1=&data1;
    p1->cid=100;
    doit1(&data1);
    printf(">>cid:    %d\n",p1->cid);



    getchar();
    return 0;
}













