/*
** File   : hello.c
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
** Author : lixingyuan@gosuncn.cn
**
**  $Date: 2018/02/08 08:45:36GMT+08:00 $
**
*/

#include "gsdk_sdk.h"

static gsdk_handle_t g_huart;       //gsdk_handle_t 客户使用句柄

int __io_puts(char *data, int len)
{
    int ret = 0;
    if (g_huart) {
		//通过发送数据
        ret = gsdk_uart_write(g_huart, (uint8_t *)data, len, 1000);
    }
    return ret;
}

int main(void)
{
	uart_config_t uart_config;      //设置串口，结构体类型
    gsdk_status_t status;           //错误信息，枚举类型
    
    uart_config.baudrate    = UART_BAUDRATE_115200;	
    uart_config.parity      = UART_PARITY_NONE;
    uart_config.stop_bit    = UART_STOP_BIT_1;
    uart_config.word_length = UART_WORD_LENGTH_8;

    //初始化串口
    status = gsdk_uart_open(UART_0, &uart_config, &g_huart);    //open uart0 to print debug log
                                                                //成功返回0，失败返回错误码
    if (status != GSDK_SUCCESS) {
        gsdk_syslog_printf("[PRINTF_DEMO]: failed to open uart %d\n", status);
        return -1;
    }

	//输出为当前串口 com9 	
	printf("The log in genie tool, please open genie tool to see.\n");

	//输出给genie 工具 进行显示 （DEBUG 口）	 
    gsdk_syslog_printf("[APP] Hello world!\n");			//The customer can use the gsdk_syslog_printf API to print the log in genie tool
    gsdk_syslog_printf("[APP] GCC %s\n", __VERSION__); 

    //关闭串口
	gsdk_uart_close(g_huart);
    //句柄设置为空
    g_huart = NULL;

    return 0;
}
