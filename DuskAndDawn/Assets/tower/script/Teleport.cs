using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Teleport : MonoBehaviour
{
    // private float distance;
    // public float a;
    public GameObject player;
    // public Transform target;
    private bool canTeleport = false;

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if (canTeleport){
            if (Input.GetKeyDown(KeyCode.F)){
                player.transform.position = gameObject.transform.GetChild(0).gameObject.transform.position;
            }
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        // if (other.gameObject.tag == "player"){
            print("can teleport");
            canTeleport = true;
        // }
    }

    private void OnTriggerExit(Collider other) 
    {
        // if (other.gameObject.tag == "player"){
            print("can not teleport");
            canTeleport = false;
        // }
    }


}
