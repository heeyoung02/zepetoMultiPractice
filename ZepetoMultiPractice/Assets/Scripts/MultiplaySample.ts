import { Button } from 'UnityEngine.UI';
import { Room$1, RoomErrorEvent, RoomLeaveEvent} from 'ZEPETO.Multiplay'
import { State } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World'

// 서버 이벤트를 송/수신하는 스크립트
export default class MultiplaySample extends ZepetoScriptBehaviour {

    public leaveBtn: Button;
    private multiPlay: ZepetoWorldMultiplay;
    private room: Room$1<State>;


    Start() {
        this.leaveBtn.onClick.AddListener(() => {
            console.log(this.room.Id);
            this.room.Leave(); // 서버 강제종료
        });

        this.multiPlay = this.gameObject.GetComponent<ZepetoWorldMultiplay>();

        // 룸이 생성되고 접속 가능할때 호출. 룸을 인자로 전달
        this.multiPlay.RoomCreated += (room: Room$1<State>) => {
            console.log(`[Room Created]`);
            console.log(room);
        };

        // 룸에 접속되면 호출. 룸을 인자로 전달
        this.multiPlay.RoomJoined += (room: Room$1<State>) => {
            console.log(`[Room Joined]`);
            console.log(room);

            this.room = room;
        };

        // 룸에 접속 해제할 때 호출. RoomLeaveEvent(상태 코드 정보)를 인자로 전달
        // 에디터로 할때 코드 안먹힘.
        this.multiPlay.RoomLeave += (event: RoomLeaveEvent) => {
            console.log(`[Room Leave]`);
            console.log(event.Code);
            console.log(event.Message);
        };

        // 룸에 재연결되었을때 호출
        this.multiPlay.RoomReconnected += (room: Room$1<State>) => {
            console.log(`[Room Reconnected]`);
            console.log(room);
        }

        // 룸 에러시 호출
        this.multiPlay.RoomError += (event: RoomErrorEvent) => {
            console.log(`[Room Error]`);
            console.log(event.Code);
            console.log(event.Message);
        }

        // 룸과 연결이 불안정할 때 호출
        this.multiPlay.RoomWeakConnection += () => {
            console.log(`[Room Weak Connection]`);
        }
    }

}