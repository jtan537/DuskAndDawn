using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TriggerRespawn : MonoBehaviour
{

    GameObject _dawnRespawnPos, _duskRespawnPos;

    private void Start()
    {
        _dawnRespawnPos = GameObject.Find("DawnRespawnPoint");
        _duskRespawnPos = GameObject.Find("DuskRespawnPoint");
    }

    private void OnTriggerEnter(Collider other)
    {
        Debug.Log("Triggered");
        // Update positions based on current respawn point
        _dawnRespawnPos = GameObject.Find("DawnRespawnPoint");
        _duskRespawnPos = GameObject.Find("DuskRespawnPoint");
        if (other.CompareTag("Player"))
        {
            // Must disable character controller to teleport player
            if (other.gameObject.name == "Dawn")
            {
                other.gameObject.GetComponent<CharacterController>().enabled = false;
                other.gameObject.transform.position = _dawnRespawnPos.transform.position;
                other.gameObject.GetComponent<CharacterController>().enabled = true;
            }
            else
            {
                other.gameObject.GetComponent<CharacterController>().enabled = false;
                other.gameObject.transform.position = _duskRespawnPos.transform.position;
                other.gameObject.GetComponent<CharacterController>().enabled = true;
            }
        }
    }
}
