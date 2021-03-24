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
    private GameObject player;
    GameObject InteractTriggerUI;
    GameObject textObj;
    // Start is called before the first frame update
    void Start()
    {
        InteractTriggerUI = GameObject.Find("Dialogue").transform.GetChild(1).gameObject;
        textObj = InteractTriggerUI.transform.GetChild(0).gameObject;

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
        if (canTeleport){
            if (Input.GetKeyDown(KeyCode.F)){
                player.GetComponent<CharacterController>().enabled = false;
                player.transform.position = gameObject.transform.GetChild(1).gameObject.transform.position;
                player.GetComponent<CharacterController>().enabled = true;

                InteractTriggerUI.SetActive(false);
                canTeleport = false;
                textObj.GetComponent<TextMeshProUGUI>().SetText("");
            }
        }
    }

    private void OnTriggerStay(Collider other)
    {
        print("can teleport");
        canTeleport = true;
        InteractTriggerUI.SetActive(true);
        textObj.GetComponent<TextMeshProUGUI>().SetText("Use Ladder");

    }

    private void OnTriggerExit(Collider other) 
    {
        print("can not teleport");
        canTeleport = false;
        InteractTriggerUI.SetActive(false);
        textObj.GetComponent<TextMeshProUGUI>().SetText("");
    }


}
