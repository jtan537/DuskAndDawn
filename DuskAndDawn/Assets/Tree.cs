using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Tree : MonoBehaviour
{
    public GameObject dialog;

    void OnTriggerEnter(Collider player)
    {
    	// if (player.gameObject.tag == "Player")
    	// {
    	// 	StartCoroutine(dialog.GetComponent<TreeDialogManager>().Type());
    	// }
    }

    void OnTriggerExit(Collider player)
    {
    	// dialog.GetComponent<TreeDialogManager>().clear();
    }
}