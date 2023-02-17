import { Button } from 'UnityEngine.UI';
import { Room$1, RoomErrorEvent, RoomLeaveEvent} from 'ZEPETO.Multiplay'
import { State } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World'

// ���� �̺�Ʈ�� ��/�����ϴ� ��ũ��Ʈ
export default class MultiplaySample extends ZepetoScriptBehaviour {

    public leaveBtn: Button;
    private multiPlay: ZepetoWorldMultiplay;
    private room: Room$1<State>;


    Start() {
        this.leaveBtn.onClick.AddListener(() => {
            console.log(this.room.Id);
            this.room.Leave(); // ���� ��������
        });

        this.multiPlay = this.gameObject.GetComponent<ZepetoWorldMultiplay>();

        // ���� �����ǰ� ���� �����Ҷ� ȣ��. ���� ���ڷ� ����
        this.multiPlay.RoomCreated += (room: Room$1<State>) => {
            console.log(`[Room Created]`);
            console.log(room);
        };

        // �뿡 ���ӵǸ� ȣ��. ���� ���ڷ� ����
        this.multiPlay.RoomJoined += (room: Room$1<State>) => {
            console.log(`[Room Joined]`);
            console.log(room);

            this.room = room;
        };

        // �뿡 ���� ������ �� ȣ��. RoomLeaveEvent(���� �ڵ� ����)�� ���ڷ� ����
        // �����ͷ� �Ҷ� �ڵ� �ȸ���.
        this.multiPlay.RoomLeave += (event: RoomLeaveEvent) => {
            console.log(`[Room Leave]`);
            console.log(event.Code);
            console.log(event.Message);
        };

        // �뿡 �翬��Ǿ����� ȣ��
        this.multiPlay.RoomReconnected += (room: Room$1<State>) => {
            console.log(`[Room Reconnected]`);
            console.log(room);
        }

        // �� ������ ȣ��
        this.multiPlay.RoomError += (event: RoomErrorEvent) => {
            console.log(`[Room Error]`);
            console.log(event.Code);
            console.log(event.Message);
        }

        // ��� ������ �Ҿ����� �� ȣ��
        this.multiPlay.RoomWeakConnection += () => {
            console.log(`[Room Weak Connection]`);
        }
    }

}