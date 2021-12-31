import { REFRESH } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
const Hits = {
    clicknum(type, name, data){
        /*
        * type 1:业务  2：自动化-控制策略 3：自动化-告警策略  4：可视化
        * */
        ApiService.post(AUTH.local_url + "/navigation/add",{type:type,name:name,data:JSON.stringify(data)})
            .then(({data}) => {
                console.log('可视化点击事件');
                console.log(data);
                if (data.code == 200) {

                } else if (data.code == 401) {
                    this.$store
                        .dispatch(REFRESH).then(res => {
							
						});
                } else {

                }
            });
    }
}
export default Hits;