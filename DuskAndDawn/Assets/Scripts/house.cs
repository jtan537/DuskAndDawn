using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class house : MonoBehaviour
{
    public GameObject dialog;

    void OnTriggerEnter(Collider player)
    {
    	if (player.gameObject.tag == "Player")
    	{
    		StartCoroutine(dialog.GetComponent<Dialog>().Type());
    	}
    }

    void OnTriggerExit(Collider player)
    {
    	dialog.GetComponent<Dialog>().clear();
    }
}
