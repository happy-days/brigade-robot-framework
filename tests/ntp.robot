| *Setting*  |     *Value*     |
| Library    |    SSHLibrary   |
| Library    |    /src/tests/parser.py |


| *Variable* |     *Value*     |
| ${IPADDR}  | %{DVC_IPADDR}   |
| ${USER}    | %{DVC_USER}     |
| ${DEVICE}  | %{DVC_NAME}   |
| ${PASSWD}  | %{DVC_PASS}     |

| *Test Case*  | *Action*        | *Argument*   |
| Login Check  | [Documentation] | This tests SSH connection and login to the device |
|              | Log             | Testing connection to ${DEVICE} with IP ${IPADDR}    |
|              | Open connection | ${IPADDR}     |
|              | Login           | ${USER}   |  ${PASSWD} |
|              | Write           | \n |
|              |  ${OUTPUT}=     | Read | delay=0.5s |
|              | Should Contain  |  ${OUTPUT}      | ${DEVICE}# |
| NTP Status   | [Documentation] | This tests NTP server status for the device |
|              | Log             | Testing NTP Status |
|              | Write           | sh ntp status |
|              |  ${OUTPUT}=     | Read | delay=0.5s |
|              | Should Contain  |  ${OUTPUT}      | Clock is synchronized |
| NTP Server   | [Documentation] | This tests if NTP server IP is correct for the device |
|              | Log             | Testing NTP Server |
|              | Write           | sh run ntp |
|              | ${OUTPUT}=     | Read | delay=0.5s |
|              |  ${SERVERIP}=   | Parse_IP | ${OUTPUT} |
|              |  Write          | sh ntp status |
|              |  ${OUTPUT}=     | Read | delay=0.5s |
|              | Should Contain  |  ${OUTPUT}      |  reference is ${SERVERIP} |
