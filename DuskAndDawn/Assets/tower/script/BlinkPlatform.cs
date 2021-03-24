using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BlinkPlatform : MonoBehaviour
{
    private float time = 2.0f;
    private bool started = false;
    private GameObject cube0;
    private GameObject cube1;
    private GameObject cube2;
    private GameObject cube3;
    

    // Start is called before the first frame update
    void Start()
    {
        cube0 = gameObject.transform.GetChild(0).gameObject;
        cube1 = gameObject.transform.GetChild(1).gameObject;
        cube2 = gameObject.transform.GetChild(2).gameObject;
        cube3 = gameObject.transform.GetChild(3).gameObject;

        cube0.SetActive(false);
        cube1.SetActive(false);
        cube2.SetActive(false);
        cube3.SetActive(false);

    }

    // Update is called once per frame
    void Update()
    {
        // print("start");
        if (started == false){
            StartCoroutine(Blink());
        }
    }

    IEnumerator Blink()
    {
        print("start");
        started = true;
        yield return new WaitForSeconds(time);
        cube0.SetActive(true);
        yield return new WaitForSeconds(time);
        cube1.SetActive(true);
        yield return new WaitForSeconds(time);
        cube2.SetActive(true);
        cube0.SetActive(false);
        yield return new WaitForSeconds(time);
        cube3.SetActive(true);
        cube1.SetActive(false);
        yield return new WaitForSeconds(time);
        cube2.SetActive(false);
        yield return new WaitForSeconds(time);
        cube3.SetActive(false);
        started = false;
    }
}
