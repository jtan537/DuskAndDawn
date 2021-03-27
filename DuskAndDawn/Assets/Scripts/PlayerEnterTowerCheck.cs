using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerEnterTowerCheck : MonoBehaviour
{
    public bool enteringTower = false;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    private void OnTriggerStay(Collider other)
    {
        if (gameObject.tag == other.gameObject.name)
        {
            enteringTower = true;
        }
    }

    private void OnTriggerExit(Collider other)
    {
        enteringTower = false;
    }
}
