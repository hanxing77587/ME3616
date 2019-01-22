/*
** File   : gpio.c
**
** Copyright (C) 2013-2018 Gosuncn. All rights reserved.
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
**      http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
**
** Author : qubo@gosuncn.cn
**
**  $Date: 2018/03/16 08:45:36GMT+08:00 $
**
*/
//控制板载LED灯的开关
//控制GPIO1，GPIO2 的高低电平

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gsdk_api.h"
#include "FreeRTOS.h"
#include "semphr.h"
#include "task.h"
#include "gsdk_ril.h"
#include "lwip/sockets.h"
#include "lwip/ip.h"

//#define TEST_INTERRUPT

//设置用户句柄
static gsdk_handle_t g_huart;

//串口输出
int __io_puts(char *data, int len)
{   
    int ret = 0; 
    if (g_huart) {
        ret = gsdk_uart_write(g_huart, (uint8_t *)data, len, 1000);
    }
    return ret;
}

//初始化串口
int log_init(void)
{
    uart_config_t uart_config;
    gsdk_status_t status;

    uart_config.baudrate    = UART_BAUDRATE_115200;
    uart_config.parity      = UART_PARITY_NONE;
    uart_config.stop_bit    = UART_STOP_BIT_1;
    uart_config.word_length = UART_WORD_LENGTH_8;

    status = gsdk_uart_open(UART_0, &uart_config, &g_huart);
    if (status != GSDK_SUCCESS) {
        gsdk_syslog_printf("[GPIO_DEMO]: failed to open uart %d\n", status);
        return -1;
    }

    printf("[GPIO_DEMO] log init....OK\r\n");

    return 0;
}


//回调函数
void gpio_callback(void *user_data)
{
    printf("[GPIO_DEMO] gpio eint handle callback!\n");
}

int main(void)
{
    gsdk_status_t status;               //各种错误信息
    gsdk_handle_t hgpio;                //句柄     
    gpio_config_t gpio_config;          //设置
    gpio_pin_t    gpio_pin;             //GPIO

	gpio_driving_current_t driving;		//GPIO_DRIVING_CURRENT_4MA    = 0,        /**< Defines GPIO driving current as 4mA.  */
    									//GPIO_DRIVING_CURRENT_8MA    = 1,        /**< Defines GPIO driving current as 8mA.  */
    									//GPIO_DRIVING_CURRENT_12MA   = 2,        /**< Defines GPIO driving current as 12mA. */
    									//GPIO_DRIVING_CURRENT_16MA   = 3         /**< Defines GPIO driving current as 16mA. */
	//查看GPIO管脚功能复用说明
    //gpio_pin = GPIO_PIN_26;            //GPIO21
    //gpio_pin = GPIO_PIN_9;             //GPIO1   驱动电流改为16mA，否则驱动不了LED
    gpio_pin = GPIO_PIN_31;              //GPIO2
    

    log_init();

#ifdef TEST_INTERRUPT
    gpio_config.direction     = 0;
    gpio_config.pull          = 0;
    gpio_config.debounce_time = 0;
    gpio_config.int_mode      = GPIO_INT_LEVEL_HIGH;
    gpio_config.callback      = gpio_callback;
    gpio_config.user_data     = NULL;

    status = gsdk_gpio_open(gpio_pin, &gpio_config, &hgpio);
    if (status != GSDK_SUCCESS)
        goto _fail;
#else
    //led(demo board)
    gpio_config.direction     = GPIO_DIRECTION_OUTPUT;          //输入输出
    gpio_config.pull          = GPIO_PULL_NONE;                 //数据类型（无，高电平，低电平）
    gpio_config.int_mode      = GPIO_INT_DISABLE;               //中断触发模式（上升沿，下降沿...）
    gpio_config.debounce_time = 0;                              //去抖时间
    gpio_config.callback      = NULL;                           //中断触发回调函数

    //初始化gpio
    status = gsdk_gpio_open(gpio_pin, &gpio_config, &hgpio);    
    if (status != GSDK_SUCCESS){
        goto _fail;
	}

    //获取当前电流
	status = gsdk_gpio_get_driving_current(hgpio,gpio_pin,&driving);    
	if (status != GSDK_SUCCESS){
        goto _fail;
	}
	printf("[GPIO_DEMO]Before set driving,Current driving:%d\r\n",driving);

    // 设置驱动电流改为16mA
	status = gsdk_gpio_set_driving_current(hgpio,gpio_pin,GPIO_DRIVING_CURRENT_16MA);
	if (status != GSDK_SUCCESS){
        goto _fail;
	}
	status = gsdk_gpio_get_driving_current(hgpio,gpio_pin,&driving);
	if (status != GSDK_SUCCESS){
        goto _fail;
	}
	printf("[GPIO_DEMO]After set driving,Current driving:%d\r\n", driving);


while(1){
    //高电平开启LED
    status = gsdk_gpio_write(hgpio, GPIO_DATA_HIGH);

    printf("[GPIO_DEMO]: set  GPIO%d  as HIGH\r\n", gpio_pin);
    if (status != GSDK_SUCCESS){
        goto _fail;
	}

    //延时1s
    vTaskDelay(1000 / portTICK_RATE_MS);

    //低高电平关闭LED
    status = gsdk_gpio_write(hgpio, GPIO_DATA_LOW);        //低高电平关闭LED
    printf("[GPIO_DEMO]: set  GPIO%d  as LOW\r\n", gpio_pin);
    
    //延时
    vTaskDelay(1000 / portTICK_RATE_MS);


    if (status != GSDK_SUCCESS){
        goto _fail;
	}
}

#endif

    return 0;

//如果有任何错误就关闭IO口
_fail:
    gsdk_gpio_close(hgpio);         
    printf("[GPIO_DEMO] Gpio test failed!\n");
    return -1;
}

