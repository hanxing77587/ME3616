/*
** File   : alarm.c
**
**  $Date: 2018/05/25 15:00:36GMT+08:00 $
**
*/

#include "gsdk_sdk.h"

#define DEBUG_LOG(fmt,...) printf("[LOGD]:F:%s,L:%d,"fmt,__func__,__LINE__,##__VA_ARGS__);
#define WARN_LOG(fmt,...) printf("[LOGW]:"fmt,##__VA_ARGS__);


static gsdk_handle_t g_huart;
gsdk_handle_t g_alarm_handle;

int __io_puts(char *data, int len)
{
    int ret = 0;
    if (g_huart) {
        ret = gsdk_uart_write(g_huart, (uint8_t *)data, len, 1000);
    }
    return ret;
}

/*This is alarm callback function ,if alarm timer expiration thhis function will be called in no-PSM*/
void rtc_alarm_cb(void *user_data)
{
	(void)user_data;
    WARN_LOG("rtc alarm handle cb!\r\n");
	gsdk_alarm_stop(g_alarm_handle);        //停止alarm定时器
	gsdk_alarm_close(g_alarm_handle);       //关闭alarm定时器
	WARN_LOG("Timer will be invalid!\r\n");
}

int main(void)
{
    uart_config_t uart_config;
    gsdk_status_t status;
    
    gsdk_boot_mode_t boot_mode;
    gsdk_rtc_wakeup_mode_t wakeup_mode;

    uart_config.baudrate    = UART_BAUDRATE_115200;
    uart_config.parity      = UART_PARITY_NONE;
    uart_config.stop_bit    = UART_STOP_BIT_1;
    uart_config.word_length = UART_WORD_LENGTH_8;

    status = gsdk_uart_open(UART_0, &uart_config, &g_huart);
    if (status != GSDK_SUCCESS) {
        gsdk_syslog_printf("[PRINTF_DEMO]: failed to open uart %d\n", status);
        DEBUG_LOG("failed to open uart %d\r\n", status);
        goto _fail;
    }
	
	/*Before call gsdk_ril_XXX function,this function must be called*/
    status = gsdk_ril_init();
    if (status != GSDK_SUCCESS) {
        DEBUG_LOG("AT init failed \r\n");
        goto _fail;
    }

	/*get boot mode function ,because this demo maybe enter PSM */
    boot_mode = gsdk_sys_get_boot_mode(&wakeup_mode);       //获取开机原因
    if (1 == boot_mode || 2 == boot_mode) {
        printf("wakeup from deep sleep\r\n");
        switch (wakeup_mode) {
        case GSDK_BOOT_RTC_TC_WAKEUP:
            WARN_LOG("it's awakened by RTC_TC\r\n");
            break;
        case GSDK_BOOT_RTC_EINT_WAKEUP:
            WARN_LOG("it's awakened by RTC_EINT\r\n");
            break;
        case GSDK_BOOT_RTC_ALARM_WAKEUP:
            WARN_LOG("it's awakened by ALARM_WAKEUP\r\n");
            break;
        case GSDK_BOOT_POWERKEY_WAKEUP:
            WARN_LOG("it's awakened by POWERKEY\r\n");
            break;
        default:
            WARN_LOG("unknown mode\r\n");
            break;
        }
    }
	else
	{
		WARN_LOG("not enter deep sleep\r\n");
	}

	/*configure alarm timer property*/
    gsdk_alarm_config_t alarm_config;
    alarm_config.callback = rtc_alarm_cb;//timer callback
    alarm_config.interval = 180;//180s
    alarm_config.periodic = 1;//timer perform periodically
    status = gsdk_alarm_open(&g_alarm_handle, &alarm_config);//打开alarm定时器
    if (status != GSDK_SUCCESS) {
        DEBUG_LOG("open alarm  failed :%d\r\n", status);
        goto _fail;
    }
	WARN_LOG("open alarm success\r\n");
    status = gsdk_alarm_start(g_alarm_handle);//开始
    if (status != GSDK_SUCCESS) {
        DEBUG_LOG("gsdk_alarm_start failed :%d\r\n", status);
        goto _fail;
    }
	WARN_LOG("start alarm success\r\n");
    status = gsdk_ril_psm_set(CPSMS, "AT+CPSMS=1");//设置 "CPSMS=1" is power saving mode(PSM)
	if(GSDK_ERROR == status)
	{
		DEBUG_LOG("set CPSMS=1 cmd error\r\n");
		goto _fail;
	}
	WARN_LOG("set CPSM=1 cmd success\r\n");
    status = gsdk_ril_psm_set(ZSLR, "AT+ZSLR");//sleep command
	if(GSDK_ERROR == status)
	{
		DEBUG_LOG("set ZSLR cmd error\r\n");
		goto _fail;
	}
	
    WARN_LOG("wait for sleep....\r\n");
    while (1) {
        vTaskDelay(1000);
    }
	
_fail:
    return 0;
}


