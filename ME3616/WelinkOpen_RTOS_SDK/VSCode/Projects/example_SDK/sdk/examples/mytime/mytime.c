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




int main(void)
{
    log_init();

while(1){
    vTaskDelay(3 * 1000 / portTICK_RATE_MS);
	printf("[GPIO_DEMO]\r\n");
    vTaskDelay(3 * 1000 / portTICK_RATE_MS);
}
    return 0;

}






