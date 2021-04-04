using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
public class Teleport : MonoBehaviour
{
    // private float distance;
    // public float a;
    // public Transform target;
    private bool canTeleport = false;
    public bool unlockedLadder = true;
    private GameObject player;
    GameObject InteractTriggerUI;
    GameObject textObj;

    Metadata _metadata;
    GameObject _curPlayer;
    // Start is called before the first frame update
    void Start()
    {
        InteractTriggerUI = GameObject.Find("Dialogue").transform.GetChild(1).gameObject;
        textObj = InteractTriggerUI.transform.GetChild(0).gameObject;

        _metadata = GameObject.Find("Metadata").GetComponent<Metadata>();

        InteractTriggerUI.SetActive(false);
        textObj.GetComponent<TextMeshProUGUI>().SetText("Use Ladder");
        if (gameObject.tag == "Dawn")
        {
            player = GameObject.Find("Dawn");
        } else if (gameObject.tag == "Dusk")
        {
            player = GameObject.Find("Dusk");
        } else
        {
            Debug.LogError("Ladder must be tagged as Dusk or Dawn");
        }
    }

    // Update is called once per frame
    void Update()
    {
        _curPlayer = _metadata.getCurPlayer();
        if (canTeleport && unlockedLadder){
            if (Input.GetKeyDown(KeyCode.F) && !_metadata.dawnInDialog && !_metadata.duskInDialog && !SwitchCharacter.isTransitioning){
                player.GetComponent<CharacterController>().enabled = false;
                player.transform.position = gameObject.transform.GetChild(1).gameObject.transform.position;
                player.GetComponent<CharacterController>().enabled = true;

                InteractTriggerUI.SetActive(false);
                canTeleport = false;
                textObj.GetComponent<TextMeshProUGUI>().SetText("");
            }
        }

        if (!unlockedLadder)
        {
            if (gameObject.GetComponent<NPC>() != null)
            {
                gameObject.GetComponent<NPC>().enabled = true;
            }
        } else
        {
            if (gameObject.GetComponent<NPC>() != null)
            {
                gameObject.GetComponent<NPC>().deactivateNPC();
                Destroy(gameObject.GetComponent<NPC>());
            }
        }
    }

    private void OnTriggerStay(Collider other)
    {
        if (unlockedLadder)
        {
            if (_curPlayer.name == other.gameObject.name && !_metadata.dawnInDialog && !_metadata.duskInDialog && !SwitchCharacter.isTransitioning)
            {
                print("can teleport");
                canTeleport = true;
                InteractTriggerUI.SetActive(true);
                textObj.GetComponent<TextMeshProUGUI>().SetText("Use Ladder");
            }
            else
            {
                print("can not teleport");
                canTeleport = false;
                InteractTriggerUI.SetActive(false);
                textObj.GetComponent<TextMeshProUGUI>().SetText("");
            }
        }
        
    }

    private void OnTriggerExit(Collider other) 
    {
        if (unlockedLadder)
        {
            print("can not teleport");
            canTeleport = false;
            InteractTriggerUI.SetActive(false);
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
        }
        
    }


}
